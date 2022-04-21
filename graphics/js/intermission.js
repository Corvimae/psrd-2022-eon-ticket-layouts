(() => {
  const REFRESH_DATE_INTERVAL = 60 * 1000; // Once a minute
	const speedcontrolBundle = 'nodecg-speedcontrol';

  dayjs.extend(window.dayjs_plugin_relativeTime);
  dayjs.extend(window.dayjs_plugin_duration);

  function updateDatePips() {
    const today = new Date();

    const mm = today.getMonth() + 1; // getMonth() is zero-based
    const dd = today.getDate();
  
    const dateString = [
      today.getFullYear(),
      (mm > 9 ? '' : '0') + mm,
      (dd > 9 ? '' : '0') + dd
    ].join('-');

    [...document.querySelectorAll('.date-pip')].forEach(elem => {
      const expectedDate = elem.getAttribute('data-date');

      if (expectedDate === dateString) {
        elem.classList.add('active');
      } else {
        elem.classList.remove('active');
      }
    });
  }

  const runDataArray = nodecg.Replicant('runDataArray', speedcontrolBundle);
	const runDataActiveRunSurrounding = nodecg.Replicant('runDataActiveRunSurrounding', speedcontrolBundle);

  setInterval(updateDatePips, REFRESH_DATE_INTERVAL);

  updateDatePips();

  function updateUpcomingRuns() {
    const pendingRunId = runDataActiveRunSurrounding.value.next;

    let nextRunIndex = -1;

    console.log(pendingRunId);

    for (const [index, run] of runDataArray.value.entries()) {
      if (run.id === pendingRunId) {
        nextRunIndex = index;
        break;
      }
    }

    let cumulativeRunTime = dayjs.duration(0);

    for (let i = 1; i <= 5; i += 1) {
      const runElem = document.querySelector(`.upcoming-run-${i}`);
      const upcomingRun = runDataArray.value[nextRunIndex + i - 1];

      if (nextRunIndex !== -1 && upcomingRun) {
        runElem.classList.remove('hidden');

        const normalizedGameName = upcomingRun.game.length > 24 ? upcomingRun.game.replace(/Pok[eé]mon/, '').trim() : upcomingRun.game;

        runElem.querySelector('.upcoming-run-name').textContent = normalizedGameName;

        const runnerTeams = upcomingRun.teams.filter(team => {
          const name = team.name?.toLowerCase() ?? '';
            
          return name.indexOf('host') === -1 && name.indexOf('commentary') === -1;
        });
        
        const runners = runnerTeams.reduce((acc, team) => [
          ...acc, 
          ...team.players.map(player => player.name),
        ], []);
  
        runElem.querySelector('.upcoming-run-runner').textContent = `${upcomingRun.category} by ${runners.join(', ')}`;

        runElem.querySelector('.upcoming-run-offset').innerHTML = cumulativeRunTime.asMilliseconds() === 0 ? 'Up next!' : `<div class="in-about">In about</div><div>${cumulativeRunTime.humanize()}</div>`;

        const durationSegments = upcomingRun.estimate?.split(':') ?? [];
        const duration = dayjs.duration({
          seconds: durationSegments[durationSegments.length - 1] ?? 0,
          minutes: durationSegments[durationSegments.length - 2] ?? 0,
          hours: durationSegments[durationSegments.length - 3] ?? 0,
        })

        cumulativeRunTime = cumulativeRunTime.add(duration);
      } else {
        runElem.classList.add('hidden');
      }
    }
  }

  NodeCG.waitForReplicants(runDataArray, runDataActiveRunSurrounding).then(() => {
		if (runDataActiveRunSurrounding.value) updateUpcomingRuns();
	});

  runDataActiveRunSurrounding.on('change', newVal => {
		if (newVal) updateUpcomingRuns();
	});
})();