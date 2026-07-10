import {
    getCongregation,
    getCongregations,
    setCongregation
} from "../js/session.js";

import {
    t
} from "../js/i18n.js";

function isEditableField(element){

    if(!element || element.disabled || element.readOnly){

        return false;

    }

    if(
        element.tagName === "INPUT" &&
        [
            "hidden",
            "submit",
            "button",
            "reset",
            "image",
            "file"
        ].includes(
            (element.type || "").toLowerCase()
        )
    ){

        return false;

    }

    return true;

}

function serializeFieldValue(element){

    if(element.tagName === "SELECT"){

        return Array.from(
            element.options
        )
            .filter(option => option.selected)
            .map(option => option.value)
            .join("\u0000");

    }

    if(
        element.type === "checkbox" ||
        element.type === "radio"
    ){

        return element.checked
            ? "checked"
            : "unchecked";

    }

    return element.value;

}

function getEditableFields(){

    return Array.from(
        document.querySelectorAll(
            "input, textarea, select"
        )
    ).filter(isEditableField);

}

function syncDirtyState(){

    getEditableFields().forEach(
        element => {

            if(element.dataset.dirtyTracked !== "true"){

                element.dataset.dirtyTracked = "true";
                element.dataset.initialValue = serializeFieldValue(element);

            }

        }
    );

}

function updateDirtyState(element){

    if(!isEditableField(element)){

        return;

    }

    if(element.dataset.dirtyTracked !== "true"){

        element.dataset.dirtyTracked = "true";
        element.dataset.initialValue = serializeFieldValue(element);

    }

    element.dataset.isDirty =
        serializeFieldValue(element) !== element.dataset.initialValue
            ? "true"
            : "false";

}

export function hasUnsavedChanges(){

    syncDirtyState();

    return getEditableFields().some(
        element => element.dataset.isDirty === "true"
    );

}

function attachUnsavedChangesTracking(){

    if(
        document.documentElement.dataset.unsavedTrackingAttached === "true"
    ){

        return;

    }

    document.documentElement.dataset.unsavedTrackingAttached = "true";

    document.addEventListener(
        "input",
        event => {

            const target = event.target;

            if(isEditableField(target)){

                updateDirtyState(target);

            }

        },
        true
    );

    document.addEventListener(
        "change",
        event => {

            const target = event.target;

            if(isEditableField(target)){

                updateDirtyState(target);

            }

        },
        true
    );

    window.addEventListener(
        "beforeunload",
        event => {

            if(hasUnsavedChanges()){

                event.preventDefault();
                event.returnValue = "";

            }

        }
    );

}

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

    attachUnsavedChangesTracking();

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

                    if(hasUnsavedChanges()){

                        const message = `${t("unsavedChanges", "Du har ulagrede endringer.")}\n\n${t("leavePageConfirm", "Er du sikker på at du vil skifte menighet? Alle ulagrede endringer vil gå tapt.")}`;

                        if(!window.confirm(message)){

                            return;

                        }

                    }

                    setCongregation(

                        button.dataset.id

                    );

                    location.reload();

                }

            );

        });

}
