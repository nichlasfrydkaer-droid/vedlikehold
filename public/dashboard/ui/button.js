export function button({

    id = "",

    text,

    className = "button-primary",

    icon = "",

    disabled = false

}){

    return `

        <button

            id="${id}"

            class="${className}"

            ${disabled ? "disabled" : ""}

        >

            ${icon}

            ${text}

        </button>

    `;

}
