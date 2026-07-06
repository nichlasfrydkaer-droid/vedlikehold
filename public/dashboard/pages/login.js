import { login } from "../js/api.js";
import { dom } from "../js/dom.js";

export function initLogin(){

  dom.loginBtn.addEventListener("click", async ()=>{

    const result =
      await login(
        dom.email.value,
        dom.password.value
      );

    dom.status.innerText =
      result.message;

    console.log(result);

  });

}
