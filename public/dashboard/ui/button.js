export function button({

    id = "",

    text,

    className = "button-primary",

    icon = ""

}){

    return `

        <button

            id="${id}"

            class="${className}"

        >

            ${icon}

            ${text}

        </button>

    `;

}
