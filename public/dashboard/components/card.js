export function createCard(
    title,
    content,
    fullWidth = false
){

    return `

        <section class="dashboard-card ${fullWidth ? "dashboard-full" : ""}">

            <h2>

                ${title}

            </h2>

            ${content}

        </section>

    `;

}
