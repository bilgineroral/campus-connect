import "./StyledButtonDeprecated.css";

export default function InstructionButton({
  text = "",
  textColor = "",
  type = "text",
  onClick = null,
  confirmationMethod = null
}) {

  return (
    <button
      className="styled-btn"
      style={{ color: textColor }}
      type={type}
      onClick={() => {
        if (confirmationMethod) {
          if (confirmationMethod() && onClick) onClick();
        } else {
          if (onClick) onClick();
        }
      }}
    >
      {text}
    </button>
  );
}
