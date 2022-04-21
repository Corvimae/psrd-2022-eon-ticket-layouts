'use strict';
(() => {
	const ANIMATE_TIME_MS = 500;

	// TO GET DONATION TOTALS, YOU MUST INSTALL AN EXTRA BUNDLE THAT SUPPLIES THEM (SEE THE nodecg-speedcontrol DOCUMENTATION).
	// The bundle name where all the tracker information is pulled from.
	// Here, we're listening for the Tiltify total by default.
	// Other bundle names that could be supplied here: speedcontrol-srcomtracker
	const trackerBundle = 'speedcontrol-gdqtracker'
	
	const donationTotalElem = document.querySelector('#donation-total');
	const progressBarFillElem = document.querySelector('#donation-progress-bar-fill');
	
	// This is where the donation total is received.
	// The "change" event is triggered when the donation total changes.
	const donationTotal = nodecg.Replicant('donationTotal', trackerBundle);
	const donationTarget = nodecg.Replicant('donationTarget', trackerBundle);

	const animationIntervalId = { current: null };

	donationTotal.on('change', (newVal, oldVal) => {
		// There's no old value on initial page load, so no animation is needed.
		if (!oldVal) {
			// Toggle the commenting on these lines if you don't want cents/pence on your donation totals.
			// ALSO SEE BELOW INSIDE animateDonationTotal.
			// Math.floor(newVal) removes the cents/pence.
			// "toLocaleString" adds commas to the donation total to separate 1000s.
			
			const value = Math.floor(newVal).toLocaleString('en-US', { minimumFractionDigits: 0 });
			//var value = newVal.toLocaleString('en-US', {minimumFractionDigits: 0});

			donationTotalElem.innerHTML = `$${value}`;

			if (animationIntervalId.current) clearInterval(animationIntervalId.current);
		} else {
			animateTotal(Number(newVal));
		}
	});

	donationTarget.on('change', newVal => {
		const value = newVal.toLocaleString('en-US', { minimumFractionDigits: 0 });

		document.querySelector('#donation-goal').innerHTML = `$${value}`;
	});

	function updateProgressBar(value) {
		const percentage = Math.min(value / donationTarget.value, 1);

		progressBarFillElem.style.width = `${percentage * 100}%`;
		progressBarFillElem.classList.remove('red', 'yellow', 'green');

		if (percentage < 0.33) {
			progressBarFillElem.classList.add('red');
		} else if (percentage < 0.66) {
			progressBarFillElem.classList.add('yellow');
		} else {
			progressBarFillElem.classList.add('green');
		}
	}
	
	NodeCG.waitForReplicants(donationTotal, donationTarget).then(() => {
		updateProgressBar(donationTotal.value);
	});
	
	function animateTotal(value) {
		if (animationIntervalId.current) clearInterval(animationIntervalId.current);

		const currentValue = Number(donationTotalElem.innerHTML.replace('$', '').replace(',', ''));

		const difference = value - currentValue;
		const timeBeforeIncrement = Math.max(difference <= ANIMATE_TIME_MS ? Math.floor(ANIMATE_TIME_MS / difference) : 1, 10);
		const incrementAmount = timeBeforeIncrement === 10 ? Math.ceil(difference / ANIMATE_TIME_MS) * 10 : 1;

		animationIntervalId.current = setInterval(() => {
			const nextValue = Math.min(value, Number(donationTotalElem.innerHTML.replace('$', '').replace(',', '')) + incrementAmount);

			donationTotalElem.innerHTML = `$${nextValue.toLocaleString('en-US', { minimumFractionDigits: 0 })}`;
			updateProgressBar(nextValue);
			if (nextValue >= value) clearInterval(animationIntervalId.current);
		}, timeBeforeIncrement);
	}
	
	// setTimeout(() => animateTotal(20000), 3000);
	// setTimeout(() => animateTotal(22000), 5000);
	// setTimeout(() => animateTotal(22005), 8000);
})();

