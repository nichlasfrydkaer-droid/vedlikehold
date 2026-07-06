export async function login(email, password){

  const response = await fetch(
    "https://api.vedlikeholdsystem.no/login",
    {
      method: "POST",
      headers: {
        "Content-Type":"application/json"
      },
      body: JSON.stringify({
        email,
        password
      })
    }
  );

  return await response.json();

}
