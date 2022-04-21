'use strict';
(() => {
	// The bundle name where all the run information is pulled from.
	const speedcontrolBundle = 'nodecg-speedcontrol';
	
	const gameTitle = document.querySelectorAll('.game-title');
	const gameCategory = document.querySelectorAll('.game-category');
	const gameEstimate = document.querySelectorAll('.game-estimate');
	const gameConsole = document.querySelectorAll('.game-console');
	const runnerLeftInfo = document.querySelector('#runner-left');
	const runnerRightInfo = document.querySelector('#runner-right');
	const hostInfo = document.querySelectorAll('.host-info');
	const nextRunElem = document.querySelector('.up-next-text');
	
	// This is where the information is received for the run we want to display.
	// The "change" event is triggered when the current run is changed.
	const runDataArray = nodecg.Replicant('runDataArray', speedcontrolBundle);
	const runDataActiveRun = nodecg.Replicant('runDataActiveRun', speedcontrolBundle);
	const runDataActiveRunSurrounding = nodecg.Replicant('runDataActiveRunSurrounding', speedcontrolBundle);

	runDataActiveRun.on('change', newVal => {
		if (newVal) updateSceneFields(newVal);
	});

	function updateUpNext(id) {
		const nextRun = runDataArray.value.find(item => item.id === id);

		if (nextRun) {
			const runnerTeams = nextRun.teams.filter(team => {
				const name = team.name?.toLowerCase() ?? '';
					
				return name.indexOf('host') === -1 && name.indexOf('commentary') === -1;
			});
			
			const runners = runnerTeams.reduce((acc, team) => [
				...acc, 
				...team.players.map(player => player.name),
			], []);

			nextRunElem.innerHTML = `${nextRun.game} ${nextRun.category} by ${runners.join(', ')}`;
		} else {
			nextRunElem.innerHTML = 'Finale!';
		}
	}

	NodeCG.waitForReplicants(runDataActiveRun).then(() => {
		if (runDataActiveRun.value) updateSceneFields(runDataActiveRun.value);
	});
	NodeCG.waitForReplicants(runDataArray, runDataActiveRunSurrounding).then(() => {
		if (runDataActiveRunSurrounding.value) updateUpNext(runDataActiveRunSurrounding.value.next);
	});
	
	runDataActiveRunSurrounding.on('change', newVal => {
		if (newVal) updateUpNext(newVal.next)
	});

	function updateElementSetHTML(elements, value) {
		[...elements].forEach(element => {
			element.innerHTML = value;
		})
	}

	function setRunnerInfo(elem, runner) {
		// speedcontrol has the ability to have multiple players in a team,
		// but for here we'll just return the 1st one.
		updateElementSetHTML(elem.querySelectorAll('.player'), runner.name);
		
		const pronounsElem = elem.querySelectorAll('.pronouns');

		updateElementSetHTML(pronounsElem, runner.pronouns);

		if (runner.pronouns) {
			[...pronounsElem].forEach(elem => {
				elem.classList.remove('hidden');
			});
		} else {
			[...pronounsElem].forEach(elem => {
				elem.classList.add('hidden');
			});
		}
	}
	
	// Sets information on the pages for the run.
	function updateSceneFields(runData) {
		updateElementSetHTML(gameTitle, runData.game);
		updateElementSetHTML(gameCategory, runData.category);
		updateElementSetHTML(gameEstimate, runData.estimate);
		updateElementSetHTML(gameConsole, `${runData.system} - ${runData.release}`);
		
		const runnerTeams = runData.teams.filter(team => {
			const name = team.name?.toLowerCase() ?? '';
				
			return name.indexOf('host') === -1 && name.indexOf('commentary') === -1;
		});

		const runner1InfoBlock = runnerTeams.length === 1 ? runnerRightInfo : runnerLeftInfo;
		const runner2InfoBlock = runnerTeams.length === 1 ? runnerLeftInfo : runnerRightInfo;

		setRunnerInfo(runner1InfoBlock, runnerTeams[0].players[0]);
	
		runner1InfoBlock.classList.remove('no-game-info');
		runner2InfoBlock?.classList.add('no-game-info');

		if (runnerTeams.length > 1) {
			document.body.classList.remove('solo');
			document.querySelector('.donation-block').classList.remove('flipped');
			runner1InfoBlock.classList.remove('solo');
			runner1InfoBlock.classList.remove('hidden');

			setRunnerInfo(runner2InfoBlock, runnerTeams[1].players[0]);
		} else {
			document.querySelector('.donation-block').classList.remove('flipped');
			document.body.classList.add('solo');
			runner1InfoBlock.classList.add('solo');
			runner2InfoBlock.classList.add('hidden');
		}

		if (hostInfo) {
			const hostTeam = runData.teams.find(team => (team.name || '').toLowerCase().indexOf('host') !== -1);

			if (hostTeam) {
				setRunnerInfo(hostInfo, hostTeam.players[0])
			}
		}

		const commentaryTeam = runData.teams.find(team => {
			const name = team.name?.toLowerCase() ?? '';
			
			return name.indexOf('commentators') !== -1 || name.indexOf('commentary') !== -1;
		});
		
		if (commentaryTeam) {
			for (let i = 1; i <= 3; i += 1) {
				const player = commentaryTeam.players[i - 1];
				const commentatorElem = document.querySelector(`.commentator-${i}`);

				if (commentatorElem) {
					if (player) {
						commentatorElem.classList.remove('hidden');

						commentatorElem.querySelector('.commentator-name').textContent = player.name;

						const commentatorPronounsElem = commentatorElem.querySelector('.commentator-pronouns');

						if (player.pronouns) {
							commentatorPronounsElem.classList.remove('hidden');
							commentatorPronounsElem.textContent = player.pronouns;
						} else {
							commentatorPronounsElem.classList.add('hidden');
						}
					} else {
						commentatorElem.classList.add('hidden');
					}
				}
			}
		} else {
			for (let i = 1; i <= 3; i += 1) {
				document.querySelector(`.commentator-${i}`)?.classList.add('hidden');
			}
		}
	}
})();