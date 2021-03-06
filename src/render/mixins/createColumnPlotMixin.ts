import { ComposeFactory } from 'dojo-compose/compose';
import { Handle } from 'dojo-core/interfaces';
import WeakMap from 'dojo-shim/WeakMap';
import { h, VNode } from 'maquette';
import { Observable } from 'rxjs/Rx';

import { DivisorOperator, InputObservable, ValueSelector } from '../../data/interfaces';
import columnar, { Column } from '../../data/columnar';

import { Domain, DomainOption, Invalidatable, Plot, Point, Values } from '../interfaces';
import createInputSeries, {
	InputSeries,
	InputSeriesOptions,
	InputSeriesState
} from './createInputSeriesMixin';

export { Column };

function normalizeDomain(domain: DomainOption): Domain {
	return Array.isArray(domain) ? domain : [ domain < 0 ? domain : 0, domain > 0 ? domain : 0 ];
}

export interface ColumnPoint<T> extends Point<Column<T>> {
	readonly displayHeight: number;
	readonly displayWidth: number;
	readonly offsetLeft: number;
}

export interface ColumnPointPlot<T> extends Plot<ColumnPoint<T>> {}

export interface ColumnPlotState<T> extends InputSeriesState<T> {
	/**
	 * Controls the maximum height of each column.
	 */
	columnHeight?: number;

	/**
	 * Controls the space between each column.
	 */
	columnSpacing?: number;

	/**
	 * Controls the width of each column.
	 */
	columnWidth?: number;

	/**
	 * Controls the range for which values are plotted with the full columnHeight. The height is distributed across the
	 * negative and positive values commensurate with the range. Any input values that exceed the minimum or maximum
	 * will still be plotted proportionally (but exceeding the height limits).
	 *
	 * If a single number is provided, if that number is greater than zero it implies a domain of [ 0, number ]. If it's
	 * less than zero it implies a domain of [ number, 0 ]. If zero it implies there are no minimum or maximum values,
	 * same for a domain of [ 0, 0 ].
	 */
	domain?: DomainOption;
}

export interface ColumnPlotOptions<T, S extends ColumnPlotState<T>> extends InputSeriesOptions<T, S> {
	/**
	 * Operates on the input series observable to compute the divisor, which is used to determine the height of the
	 * columns.
	 *
	 * If not provided, and a `divisorOperator()` implementation has been mixed in, that implementation is used.
	 * Otherwise the divisor will be set to `1`.
	 */
	divisorOperator?: DivisorOperator<T>;

	/**
	 * Select the value from the input. Columns height is determined by this value.
	 *
	 * If not provided, and a `valueSelector()` implementation has been mixed in, that implementation is used. Otherwise
	 * values will be hardcoded to `0`.
	 */
	valueSelector?: ValueSelector<T>;
}

export interface ColumnPlotMixin<T> {
	/**
	 * Default return value for `getColumnHeight()`, in case `columnHeight` is not present in the state.
	 *
	 * If not provided, the default value that ends up being used is 0.
	 */
	readonly columnHeight?: number;

	/**
	 * Default return value for `getColumnSpacing()`, in case `columnSpacing` is not present in the state.
	 *
	 * If not provided, the default value that ends up being used is 0.
	 */
	readonly columnSpacing?: number;

	/**
	 * Default return value for `getColumnWidth()`, in case `columnWidth` is not present in the state.
	 *
	 * If not provided, the default value that ends up being used is 0.
	 */
	readonly columnWidth?: number;

	/**
	 * Default return value for `getDomain()`, in case `domain` is not present in the state.
	 *
	 * If a single number is provided, if that number is greater than zero it implies a domain of [ 0, number ]. If it's
	 * less than zero it implies a domain of [ number, 0 ]. If zero it implies there are no minimum or maximum values,
	 * same for a domain of [ 0, 0 ].
	 *
	 * If not provided, the default value that ends up being used is [ 0, 0 ].
	 */
	readonly domain?: Domain;

	/**
	 * Operates on the input series observable to compute the divisor, which is used to determine the height of the
	 * columns.
	 *
	 * Can be overriden by specifying a `divisorOperator()` option. If neither is available a static divisor of `1`
	 * will be used.
	 */
	readonly divisorOperator?: DivisorOperator<T>;

	/**
	 * Select the value from the input. Columns height is determined by this value.
	 *
	 * Can be overriden by specifying a `valueSelector()` option. If neither is available all values will be hardcoded
	 * to `0`.
	 */
	readonly valueSelector?: ValueSelector<T>;

	/**
	 * Controls the maximum height of each column.
	 */
	getColumnHeight(): number;

	/**
	 * Controls the space between each column.
	 */
	getColumnSpacing(): number;

	/**
	 * Controls the width of each column.
	 */
	getColumnWidth(): number;

	/**
	 * Controls the range for which values are plotted with the full columnHeight. The height is distributed across the
	 * negative and positive values commensurate with the range. Any input values that exceed the minimum or maximum
	 * will still be plotted proportionally (but exceeding the height limits).
	 */
	getDomain(): Domain;

	/**
	 * Plot "points" for each column.
	 */
	plot(): ColumnPointPlot<T>;

	/**
	 * Create VNodes for each column given its points.
	 */
	renderPlotPoints(points: ColumnPoint<T>[]): VNode[];
}

/**
 * Renders columns. To be mixed into dojo-widgets/createWidget.
 */
export type ColumnPlot<T, S extends ColumnPlotState<T>> =
	InputSeries<T, S> & Invalidatable & ColumnPlotMixin<T>;

export interface ColumnPlotFactory<T> extends ComposeFactory<
	ColumnPlot<T, ColumnPlotState<T>>,
	ColumnPlotOptions<T, ColumnPlotState<T>>
> {
	<T, S extends ColumnPlotState<T>>(options?: ColumnPlotOptions<T, S>): ColumnPlot<T, S>;
}

interface PrivateState {
	series: Column<any>[];
}

const privateStateMap = new WeakMap<ColumnPlot<any, ColumnPlotState<any>>, PrivateState>();

const createColumnPlot: ColumnPlotFactory<any> = createInputSeries
	.extend({
		getColumnHeight(this: ColumnPlot<any, ColumnPlotState<any>>) {
			const { columnHeight = this.columnHeight || 0 } = this.state;
			return columnHeight;
		},

		getColumnSpacing(this: ColumnPlot<any, ColumnPlotState<any>>) {
			const { columnSpacing = this.columnSpacing || 0 } = this.state;
			return columnSpacing;
		},

		getColumnWidth(this: ColumnPlot<any, ColumnPlotState<any>>) {
			const { columnWidth = this.columnWidth || 0 } = this.state;
			return columnWidth;
		},

		getDomain(this: ColumnPlot<any, ColumnPlotState<any>>) {
			const { domain = this.domain || [ 0, 0 ] } = this.state;
			return normalizeDomain(domain);
		},

		plot<T>(this: ColumnPlot<T, ColumnPlotState<T>>): ColumnPointPlot<T> {
			const { series } = privateStateMap.get(this);
			const columnHeight = this.getColumnHeight();
			const columnSpacing = this.getColumnSpacing();
			const displayWidth = this.getColumnWidth();
			const [ domainMin, domainMax ] = this.getDomain();

			let mostNegativeRelValue = 0;
			let mostNegativeValue = 0;
			let mostPositiveRelValue = 0;
			let mostPositiveValue = 0;
			for (const { relativeValue, value } of series) {
				if (relativeValue < mostNegativeRelValue) {
					mostNegativeRelValue = relativeValue;
				}
				else if (relativeValue > mostPositiveRelValue) {
					mostPositiveRelValue = relativeValue;
				}

				if (value < mostNegativeValue) {
					mostNegativeValue = value;
				}
				else if (value > mostPositiveValue) {
					mostPositiveValue = value;
				}
			}

			// Maximum height of positive columns. Initially assume there are no negative columns, this will be
			// refined later. The height of negative columns is determined by taking columnHeight and subtracting
			// positiveHeight.
			let positiveHeight = columnHeight;

			// The height of each column ("display height") is determined by the column's relative value and the
			// available positive or negative height. The relative value needs to be corrected for the available
			// height if there are both negative and positive columns.
			let negativeDisplayHeightCorrection = 1;
			let positiveDisplayHeightCorrection = 1;
			if (mostNegativeRelValue < 0 && mostPositiveRelValue > 0) {
				negativeDisplayHeightCorrection /= -mostNegativeRelValue;
				positiveDisplayHeightCorrection /= mostPositiveRelValue;
			}

			// Relative column values need to be further adjusted if a domain minimum and/or maximum is specified.
			// Only negative columns who's value equals the domain minimum, or positive columns who's value equals
			// the domain maximum, must be rendered with the full available height.
			//
			// This is also where enough information is available to compute the correct positiveHeight.
			if (domainMin !== 0 || domainMax !== 0) {
				if (domainMin < 0) {
					if (domainMax === 0) {
						// There shouldn't be any positive columns.
						negativeDisplayHeightCorrection *= mostNegativeValue / domainMin;
						positiveHeight = 0;
					}
					else if (domainMax > 0) {
						// There may be both positive and negative columns.
						negativeDisplayHeightCorrection *= mostNegativeValue / domainMin;
						positiveDisplayHeightCorrection *= mostPositiveValue / domainMax;
						positiveHeight *= domainMax / (domainMax - domainMin);
					}
				}
				else if (domainMin === 0 && domainMax > 0) {
					// There should only be positive columns.
					positiveDisplayHeightCorrection *= mostPositiveValue / domainMax;
				}
				// FIXME: Should this raise an error if domainMin > 0 or domainMax < 0? These are not valid domains
				// for column charts (issue #6).
			}
			// Without a domain, adjust the positiveHeight only if there are negative columns.
			else if (mostNegativeRelValue < 0) {
				if (mostPositiveRelValue === 0) {
					// There are definitely no positive columns.
					positiveHeight = 0;
				}
				else {
					// There are both positive and negative columns.
					positiveHeight *= mostPositiveRelValue / (mostPositiveRelValue - mostNegativeRelValue);
				}
			}

			// There should be space for a line dividing negative and positive columns, so start 1px lower.
			const negativeOffset = positiveHeight + 1;

			let verticalValues = Values.None;
			let x2 = 0;

			const points = series.map((column, index) => {
				const isNegative = column.relativeValue < 0;
				verticalValues |= isNegative ? Values.Negative : Values.Positive;

				const availableHeight = isNegative ? positiveHeight - columnHeight : positiveHeight;
				const correction = isNegative ? negativeDisplayHeightCorrection : positiveDisplayHeightCorrection;
				const displayHeight = availableHeight * column.relativeValue * correction;

				const x1 = (displayWidth + columnSpacing) * index;
				x2 = x1 + displayWidth + columnSpacing;

				return {
					datum: column,
					displayHeight,
					displayWidth,
					offsetLeft: columnSpacing / 2,
					x1,
					x2,
					y1: isNegative ? negativeOffset : positiveHeight - displayHeight,
					y2: isNegative ? negativeOffset + displayHeight + 1 : positiveHeight
				};
			});

			let height = columnHeight;
			if (verticalValues & Values.Negative) {
				// Chart height includes the line between negative and positive columns.
				height += 1;
			}

			return {
				height,
				horizontalValues: Values.Positive,
				points,
				verticalValues,
				width: x2,
				zero: { x: 0, y: positiveHeight }
			};
		},

		renderPlotPoints<T>(points: ColumnPoint<T>[]) {
			return points.map(({ datum, displayHeight, displayWidth, offsetLeft, x1, y1 }) => {
				return h('rect', {
					key: datum.input,
					height: String(displayHeight),
					width: String(displayWidth),
					x: String(x1 + offsetLeft),
					y: String(y1)
				});
			});
		}
	})
	.mixin({
		initialize<T>(
			instance: ColumnPlot<T, ColumnPlotState<T>>,
			{
				divisorOperator,
				valueSelector
			}: ColumnPlotOptions<T, ColumnPlotState<T>> = {}
		) {
			let operator: DivisorOperator<T>;
			if (!divisorOperator) {
				// Allow a divisorOperator implementation to be mixed in.
				operator = (observable: InputObservable<T>, valueSelector: ValueSelector<T>) => {
					if (instance.divisorOperator) {
						return instance.divisorOperator(observable, valueSelector);
					}

					// Default to 1, don't throw at runtime.
					return Observable.of(1);
				};
			}
			else {
				operator = divisorOperator;
			}

			let selector: ValueSelector<T>;
			if (!valueSelector) {
				// Allow a valueSelector implementation to be mixed in.
				selector = (input: T) => {
					if (instance.valueSelector) {
						return instance.valueSelector(input);
					}

					// Default to 0, don't throw at runtime.
					return 0;
				};
			}
			else {
				selector = valueSelector;
			}

			privateStateMap.set(instance, {
				// Initialize with an empty series since InputSeries only provides a series once it's available.
				series: []
			});

			let handle: Handle;
			const subscribe = (inputSeries: Observable<T[]>) => {
				if (handle) {
					handle.destroy();
				}

				const subscription = columnar(inputSeries, selector, operator)
					.subscribe((series) => {
						privateStateMap.get(instance).series = series;
						// invalidate() is typed as being optional, but that's just a workaround until
						// <https://github.com/dojo/compose/issues/74> is in place. Silence the strict null check
						// violation for now.
						instance.invalidate!();
					});

				handle = instance.own({
					destroy() {
						subscription.unsubscribe();
					}
				});
			};

			// InputSeries may emit 'inputserieschange' before this initializer can listen for it.
			// Access the series directly.
			if (instance.inputSeries) {
				subscribe(instance.inputSeries);
			}
			// Update the series if it changes.
			instance.own(instance.on('inputserieschange', ({ observable }) => subscribe(observable)));
		}
	});

export default createColumnPlot;
