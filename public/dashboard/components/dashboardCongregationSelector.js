import {
    getCongregation,
    getCongregations
} from "../js/session.js";

export function renderCongregationSelector(){

    const current =
        getCongregation();

    const congregations =
        getCongregations();

    if(congregations.length <= 1){

        return `

            <div
                class="dashboard-user-congregation"
            >

                ${current?.name ?? ""}

            </div>

        `;

    }

    return `

        <select
            id="congregationSelector"
            class="dashboard-congregation-selector"
        >

            ${congregations.map(c=>`

                <option

                    value="${c.id}"

                    ${c.id===current.id ? "selected" : ""}

                >

                    ${c.name}

                </option>

            `).join("")}

        </select>

    `;

}
