export function section(
    title,
    content
){

    return `

        <div class="report-section">

            <h3>

                ${title}

            </h3>

            ${content}

        </div>

    `;

}
