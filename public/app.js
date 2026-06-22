async function loadJob() {

const params = new URLSearchParams(window.location.search);
const jobId = params.get("id");

  try {

    const response = await fetch(`/jobdata/${jobId}.json`);
    const job = await response.json();

    document.getElementById("jobTitle").textContent =
      `JOBBKORT ${job.nummer} - ${job.titel.toUpperCase()}`;

    document.getElementById("frequency").textContent =
      job.frekvens;

    document.getElementById("location").textContent =
      job.sted;

    document.getElementById("merk").textContent =
      job.merk;

    const taskList = document.getElementById("tasks");

    job.oppgaver.forEach(task => {

      const li = document.createElement("li");
      li.textContent = task;

      taskList.appendChild(li);

    });

  } catch(err) {

    document.body.innerHTML =
      "<h1>Jobbkort ikke fundet</h1>";

  }

}

loadJob();
