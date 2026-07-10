async function readJobcardData(language) {
  const response = await fetch(`https://vedlikeholdsystem.no/jobdata/${language}/index.json`);

  if (!response.ok) {
    return [];
  }

  const data = await response.json();

  return Array.isArray(data) ? data : [];
}

function jsonResponse(body, init = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...(init.headers || {})
    }
  });
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === "/login") {
      return jsonResponse({ success: true, token: "demo-token" });
    }

    if (path === "/me") {
      return jsonResponse({
        success: true,
        user: { id: 1, name: "Demo bruger" },
        congregations: [
          { id: "Test DK", name: "Test DK", language: "da" },
          { id: "Elverum", name: "Elverum", language: "no" }
        ]
      });
    }

    if (path === "/jobcards") {
      const congregation = url.searchParams.get("congregation") || "Test DK";
      const language = congregation === "Elverum" ? "no" : "da";
      const jobcards = await readJobcardData(language);

      return jsonResponse({
        success: true,
        congregation,
        jobcards: jobcards.map(jobcard => ({
          id: jobcard.nummer,
          title: jobcard.titel || jobcard.nummer,
          description: jobcard.undertittel || "",
          jobcard_number: jobcard.nummer,
          interval: jobcard.frekvens || "",
          next_execution: "",
          visible: true,
          raw: jobcard
        }))
      });
    }

    if (path === "/tasks") {
      return jsonResponse({ success: true, tasks: [] });
    }

    if (path === "/reports") {
      return jsonResponse({ success: true, reports: [] });
    }

    return new Response("Worker OK");
  }
};
