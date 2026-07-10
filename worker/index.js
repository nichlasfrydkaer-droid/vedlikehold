const DEFAULT_JOBCARDS = [
  {
    id: 1,
    title: "Jobkort 1",
    description: "Standard jobkort for testmenigheden.",
    jobcard_number: 1,
    interval: "30 dage",
    next_execution: "",
    visible: true
  }
];

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
      return jsonResponse({
        success: true,
        congregation,
        jobcards: DEFAULT_JOBCARDS.map(jobcard => ({
          ...jobcard,
          title: congregation === "Elverum" ? `${jobcard.title} (${congregation})` : jobcard.title
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
