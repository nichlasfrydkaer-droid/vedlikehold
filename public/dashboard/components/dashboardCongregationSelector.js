import {
    getCongregation,
    getCongregations,
    setCongregation
} from "../js/session.js";

export function renderCongregationSelector(){

    const current =
        getCongregation();

    const congregations =
        getCongregations();

    if(!current){

        return "";

    }

    if(congregations.length <= 1){

        return `

            <div
                class="dashboard-congregation-single"
            >

                ${current.name}

            </div>

        `;

    }

    return `

        <div
            class="dashboard-congregation-picker"
        >

            <button

                id="congregationButton"

                class="dashboard-congregation-button"

            >

                ▼ ${current.name}

            </button>

            <div

                id="congregationDropdown"

                class="dashboard-congregation-dropdown hidden"

            >

                ${congregations.map(c=>`

                    <button

                        class="dashboard-congregation-item"

                        data-id="${c.id}"

                    >

                        ${c.id===current.id ? "✓ " : ""}

                        ${c.name}

                    </button>

                `).join("")}

            </div>

        </div>

    `;

}

export function initCongregationSelector(){

    const button =
        document.getElementById(
            "congregationButton"
        );

    const dropdown =
        document.getElementById(
            "congregationDropdown"
        );

    if(!button || !dropdown){

        return;

    }

    button.addEventListener(

        "click",

        e=>{

            e.stopPropagation();

            dropdown.classList.toggle(
                "hidden"
            );

        }

    );

    document.addEventListener(

        "click",

        ()=>{

            dropdown.classList.add(
                "hidden"
            );

        }

    );

    dropdown
        .querySelectorAll(
            ".dashboard-congregation-item"
        )
        .forEach(button=>{

            button.addEventListener(

                "click",

                ()=>{

                    setCongregation(

                        button.dataset.id

                    );

                    location.reload();

                }

            );

        });

}
