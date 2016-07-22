import { Observable, Subscriber } from 'rxjs/Rx';

import accumulate from 'src/data/accumulate';
import sort from 'src/data/sort';

export interface PlayCount {
	artist: string;
	count: number;
}

export default function getObservable (): Observable<PlayCount[]> {
	const source = new Observable<PlayCount>((subscriber: Subscriber<PlayCount>) => {
		const data = [
			{ artist: 'Hawksley Workman', count: 31910 },
			{ artist: 'Buck 65', count: 21192 },
			{ artist: 'The Weakerthans', count: 13495 },
			{ artist: 'Metric', count: 10067 },
			{ artist: 'The New Pornographers', count: 6201 },
			{ artist: 'Bike For Three!', count: 6022 },
			{ artist: 'Mounties', count: 3097 },
			{ artist: 'Limblifter', count: 2800 },
			{ artist: 'Arcade Fire', count: 2172 }
		];

		var handle = setInterval(() => { // tslint:disable-line:no-var-keyword
			if (data.length) {
				subscriber.next(data.shift());
			} else {
				subscriber.complete();
				clearInterval(handle);
			}
		}, 1000);
	});

	const accumulated = accumulate(source);
	const sorted = sort(accumulated, ({ artist }) => artist.replace(/^The\s+/, ''));
	return sorted;
}
