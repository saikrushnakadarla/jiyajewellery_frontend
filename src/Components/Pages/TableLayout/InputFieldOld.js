import React from "react";
import Select from "react-select";
import "./InputField.css";

const InputField = ({
  label,
  type = "text",
  placeholder,
  value,
  readOnly,
  onChange,
  name,
  options = [],
  required = false,
  max,
  autoFocus
}) => {
  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      border: "none",
      borderBottom: `1px solid ${state.isFocused ? "#8c5d20" : "#A26D2B"}`,
      borderRadius: 0,
      boxShadow: "none",
      "&:hover": { borderBottom: "2px solid #8c5d20" },
      minHeight: "32px",
      fontSize: "14px",
      backgroundColor: "transparent"
    }),
    valueContainer: (provided) => ({
      ...provided,
      padding: "0px",
    }),
    input: (provided) => ({
      ...provided,
      margin: "0px",
    }),
    indicatorsContainer: (provided) => ({
      ...provided,
      padding: "0px",
    }),
    menu: (provided) => ({
      ...provided,
      zIndex: 9999,
    }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
  };

  return (
    <div className="input-field-container">
      {label && <label className="input-label">{label}</label>}

      {type === "select" ? (
        <Select
          name={name}
          options={options}
          placeholder={placeholder || "Select"}
          isDisabled={readOnly}
          value={value ? options.find((opt) => opt.value === value) : null}
          onChange={(selectedOption) =>
            onChange({
              target: { name, value: selectedOption ? selectedOption.value : "" },
            })
          }
          styles={customStyles}
          menuPortalTarget={document.body}
          isClearable
          autoFocus={autoFocus}
        />
      ) : (
        <input
          className="styled-input"
          type={type}
          name={name}
          placeholder={placeholder}
          value={value}
          readOnly={readOnly}
          onChange={onChange}
          required={required}
          max={max}
          autoFocus={autoFocus}
        />
      )}
    </div>
  );
};

export default InputField;
