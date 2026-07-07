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

}
