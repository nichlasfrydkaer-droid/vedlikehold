import { login } from "../js/api.js";
import { dom } from "../js/dom.js";

export function initLogin(){

  dom.loginBtn.addEventListener("click", async ()=>{

    const result =
      await login(
        dom.email.value,
        dom.password.value
      );

if(result.success){

    localStorage.setItem(
        "dashboard_token",
        result.token
    );

    dom.status.innerText =
        "Innlogging vellykket.";

}else{

    dom.status.innerText =
        result.message;

}

    console.log(result);

  });

}
