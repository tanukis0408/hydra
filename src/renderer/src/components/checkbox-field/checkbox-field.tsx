import { useId } from "react";
import { CheckIcon, QuestionIcon } from "@primer/octicons-react";
import { Tooltip } from "react-tooltip";
import "./checkbox-field.scss";

export interface CheckboxFieldProps
  extends React.DetailedHTMLProps<
    React.InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  > {
  label: string | React.ReactNode;
  hint?: string;
}

export function CheckboxField({ label, hint, ...props }: CheckboxFieldProps) {
  const id = useId();
  const hintId = useId();

  return (
    <div className="checkbox-field">
      <div
        className={`checkbox-field__checkbox ${props.checked ? "checked" : ""}`}
      >
        <input
          id={id}
          type="checkbox"
          className="checkbox-field__input"
          {...props}
        />
        {props.checked && <CheckIcon />}
      </div>
      <label htmlFor={id} className="checkbox-field__label">
        <span className="checkbox-field__label-text">{label}</span>
        {hint && (
          <>
            <span
              className="checkbox-field__hint"
              data-tooltip-id={hintId}
              data-tooltip-content={hint}
            >
              <QuestionIcon size={12} />
            </span>
            <Tooltip id={hintId} />
          </>
        )}
      </label>
    </div>
  );
}
