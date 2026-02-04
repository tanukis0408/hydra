import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "./redux";
import {
  setKrakenCloudModalVisible,
  setKrakenCloudModalHidden,
} from "@renderer/features";
import { KrakenCloudFeature } from "@types";

export function useSubscription() {
  const dispatch = useAppDispatch();

  const { isKrakenCloudModalVisible, feature } = useAppSelector(
    (state) => state.subscription
  );

  const showKrakenCloudModal = useCallback(
    (feature: KrakenCloudFeature) => {
      dispatch(setKrakenCloudModalVisible(feature));
    },
    [dispatch]
  );

  const hideKrakenCloudModal = useCallback(() => {
    dispatch(setKrakenCloudModalHidden());
  }, [dispatch]);

  return {
    isKrakenCloudModalVisible,
    krakenCloudFeature: feature,
    showKrakenCloudModal,
    hideKrakenCloudModal,
  };
}
