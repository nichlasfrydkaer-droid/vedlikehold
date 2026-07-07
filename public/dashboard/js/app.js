const page =
    document.body.dataset.page;

switch(page){

    case "login":

        import("../pages/login.js")
            .then(m => m.initLogin());

        break;

    case "dashboard":

        import("../pages/dashboard.js")
            .then(m => m.initDashboard());

        break;

    case "report":

        import("../pages/report.js")
            .then(m => m.initReport());

        break;

    case "task":

        import("../pages/task.js")
            .then(m => m.initTask());

        break;

}
