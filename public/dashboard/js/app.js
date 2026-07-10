const page =
    document.body.dataset.page;

async function initPage(

    loader,

    init,

    options = {}

){

    const module =
        await loader;

    await module[init]();

    if(options.dashboardLayout){

        const layout =
            await import(
                "../layouts/dashboardLayout.js"
            );

        layout.renderDashboardLayout();

    }

}

switch(page){

    case "login":

        initPage(
            import("../pages/login.js"),
            "initLogin"
        );

        break;

    case "dashboard":

        initPage(
            import("../pages/dashboard.js"),
            "initDashboard"
        );

        break;

    case "reports":

        initPage(
            import("../pages/reports.js"),
            "initReports",
            { dashboardLayout:true }
        );

        break;

    case "jobcards":

        initPage(
            import("../pages/jobcards.js"),
            "initJobcards",
            { dashboardLayout:true }
        );

        break;

    case "report":

        initPage(
            import("../pages/report.js"),
            "initReport",
            { dashboardLayout:true }
        );

        break;

    case "tasks":

        initPage(
            import("../pages/tasks.js"),
            "initTasks",
            { dashboardLayout:true }
        );

        break;

    case "task":

        initPage(
            import("../pages/task.js"),
            "initTask",
            { dashboardLayout:true }
        );

        break;

    case "taskCreated":

        initPage(
            import("../pages/taskCreated.js"),
            "initTaskCreated",
            { dashboardLayout:true }
        );

        break;

    case "o":

        initPage(
            import("../pages/o.js"),
            "initO"
        );

        break;

}
