export function addDashboardWidget(html){

    const grid =
        document.getElementById("dashboardGrid");

    if(!grid){
        return;
    }

    grid.insertAdjacentHTML(

        "beforeend",

        html

    );

}
