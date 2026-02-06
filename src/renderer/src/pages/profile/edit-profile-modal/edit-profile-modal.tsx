import { useContext, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Trans, useTranslation } from "react-i18next";

import { DeviceCameraIcon, TrashIcon } from "@primer/octicons-react";
import {
  Avatar,
  Button,
  CheckboxField,
  Link,
  Modal,
  ModalProps,
  TextField,
} from "@renderer/components";
import { useProfileCollections, useToast, useUserDetails } from "@renderer/hooks";

import { yupResolver } from "@hookform/resolvers/yup";

import * as yup from "yup";

import { userProfileContext } from "@renderer/context";
import "./edit-profile-modal.scss";

interface FormValues {
  profileImageUrl?: string;
  displayName: string;
}

export function EditProfileModal(
  props: Omit<ModalProps, "children" | "title">
) {
  const { t } = useTranslation("user_profile");

  const schema = yup.object({
    displayName: yup
      .string()
      .required(t("required_field"))
      .min(3, t("displayname_min_length"))
      .max(50, t("displayname_max_length")),
  });

  const {
    register,
    control,
    setValue,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<FormValues>({
    resolver: yupResolver(schema),
  });

  const { getUserProfile } = useContext(userProfileContext);

  const { userDetails, fetchUserDetails, hasActiveSubscription } =
    useUserDetails();

  const {
    state: collectionsState,
    setSystemVisibility,
    addCustomCategory,
    removeCustomCategory,
    toggleCustomCategoryVisibility,
  } = useProfileCollections(userDetails?.id);

  const [newCategory, setNewCategory] = useState("");

  useEffect(() => {
    if (userDetails) {
      setValue("displayName", userDetails.displayName);
    }
  }, [setValue, userDetails]);

  const { patchUser } = useUserDetails();

  const { showSuccessToast, showErrorToast } = useToast();

  const handleAddCategory = () => {
    const trimmed = newCategory.trim();
    if (!trimmed) return;
    const created = addCustomCategory(trimmed);
    if (!created) {
      showErrorToast(
        t("profile_category_exists", {
          defaultValue: "Category already exists.",
        })
      );
      return;
    }
    setNewCategory("");
  };

  const onSubmit = async (values: FormValues) => {
    return patchUser(values)
      .then(async () => {
        await Promise.allSettled([fetchUserDetails(), getUserProfile()]);
        props.onClose();
        showSuccessToast(t("saved_successfully"));
      })
      .catch(() => {
        showErrorToast(t("try_again"));
      });
  };

  return (
    <Modal {...props} title={t("edit_profile")} clickOutsideToClose={false}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="edit-profile-modal__form"
      >
        <div className="edit-profile-modal__content">
          <Controller
            control={control}
            name="profileImageUrl"
            render={({ field: { value, onChange } }) => {
              const handleChangeProfileAvatar = async () => {
                const { filePaths } = await window.electron.showOpenDialog({
                  properties: ["openFile"],
                  filters: [
                    {
                      name: "Image",
                      extensions: ["jpg", "jpeg", "png", "gif", "webp"],
                    },
                  ],
                });

                if (filePaths && filePaths.length > 0) {
                  const path = filePaths[0];

                  if (!hasActiveSubscription) {
                    const { imagePath } = await window.electron
                      .processProfileImage(path)
                      .catch(() => {
                        showErrorToast(t("image_process_failure"));
                        return { imagePath: null };
                      });

                    onChange(imagePath);
                  } else {
                    onChange(path);
                  }
                }
              };

              const getImageUrl = () => {
                if (value) return `local:${value}`;
                if (userDetails?.profileImageUrl)
                  return userDetails.profileImageUrl;

                return null;
              };

              const imageUrl = getImageUrl();

              return (
                <button
                  type="button"
                  className="edit-profile-modal__avatar-container"
                  onClick={handleChangeProfileAvatar}
                >
                  <Avatar
                    size={128}
                    src={imageUrl}
                    alt={userDetails?.displayName}
                  />

                  <div className="edit-profile-modal__avatar-overlay">
                    <DeviceCameraIcon size={38} />
                  </div>
                </button>
              );
            }}
          />

          <TextField
            {...register("displayName")}
            label={t("display_name")}
            minLength={3}
            maxLength={50}
            containerProps={{ style: { width: "100%" } }}
            error={errors.displayName?.message}
          />

          <div className="edit-profile-modal__section">
            <div className="edit-profile-modal__section-header">
              <h3 className="edit-profile-modal__section-title">
                {t("profile_collections_title", {
                  defaultValue: "Collections",
                })}
              </h3>
              <p className="edit-profile-modal__section-subtitle">
                {t("profile_collections_edit_hint", {
                  defaultValue:
                    "Choose which lists appear on your profile and add custom ones.",
                })}
              </p>
            </div>

            <div className="edit-profile-modal__category-list">
              <CheckboxField
                label={t("favorites", { defaultValue: "Favorites" })}
                checked={collectionsState.systemVisibility.favorites}
                onChange={(event) =>
                  setSystemVisibility("favorites", event.target.checked)
                }
              />
              <CheckboxField
                label={t("profile_category_playing", {
                  defaultValue: "Playing",
                })}
                checked={collectionsState.systemVisibility.playing}
                onChange={(event) =>
                  setSystemVisibility("playing", event.target.checked)
                }
              />
              <CheckboxField
                label={t("profile_category_want_to_play", {
                  defaultValue: "Want to play",
                })}
                checked={collectionsState.systemVisibility.want_to_play}
                onChange={(event) =>
                  setSystemVisibility("want_to_play", event.target.checked)
                }
              />
              <CheckboxField
                label={t("profile_category_dropped", {
                  defaultValue: "Dropped",
                })}
                checked={collectionsState.systemVisibility.dropped}
                onChange={(event) =>
                  setSystemVisibility("dropped", event.target.checked)
                }
              />
            </div>

            <div className="edit-profile-modal__custom-category-input">
              <TextField
                label={t("profile_category_custom", {
                  defaultValue: "Custom category",
                })}
                placeholder={t("profile_category_custom_placeholder", {
                  defaultValue: "Add a category",
                })}
                value={newCategory}
                onChange={(event) => setNewCategory(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleAddCategory();
                  }
                }}
                containerProps={{ style: { flex: 1 } }}
              />
              <Button
                type="button"
                className="edit-profile-modal__add-category"
                onClick={handleAddCategory}
              >
                {t("add", { defaultValue: "Add" })}
              </Button>
            </div>

            {collectionsState.customCategories.length > 0 && (
              <div className="edit-profile-modal__custom-category-list">
                {collectionsState.customCategories.map((category) => (
                  <div
                    className="edit-profile-modal__custom-category-row"
                    key={category.id}
                  >
                    <CheckboxField
                      label={category.label}
                      checked={category.visible !== false}
                      onChange={(event) =>
                        toggleCustomCategoryVisibility(
                          category.id,
                          event.target.checked
                        )
                      }
                    />
                    <button
                      type="button"
                      className="edit-profile-modal__custom-category-remove"
                      onClick={() => removeCustomCategory(category.id)}
                      aria-label={t("remove", { defaultValue: "Remove" })}
                    >
                      <TrashIcon size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <small className="edit-profile-modal__hint">
          <Trans i18nKey="privacy_hint" ns="user_profile">
            <Link to="/settings" />
          </Trans>
        </small>

        <Button
          disabled={isSubmitting}
          className="edit-profile-modal__submit"
          type="submit"
        >
          {isSubmitting ? t("saving") : t("save")}
        </Button>
      </form>
    </Modal>
  );
}
