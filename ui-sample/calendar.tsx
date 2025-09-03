"use client";

import * as React from "react";
import {
	ChevronDownIcon,
	ChevronLeftIcon,
	ChevronRightIcon,
} from "lucide-react";
import { DayButton, DayPicker, getDefaultClassNames } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";

function Calendar({
	className,
	classNames,
	showOutsideDays = true,
	captionLayout = "label",
	buttonVariant = "ghost",
	formatters,
	components,
	...props
}: React.ComponentProps<typeof DayPicker> & {
	buttonVariant?: React.ComponentProps<typeof Button>["variant"];
}) {
	const defaultClassNames = getDefaultClassNames();

	return (
		<DayPicker
			showOutsideDays={showOutsideDays}
			className={cn(
				"bg-white group/calendar p-6 rounded-xl shadow-lg border border-gray-100 [--cell-size:2.75rem] sm:[--cell-size:3rem] [[data-slot=card-content]_&]:bg-transparent [[data-slot=popover-content]_&]:bg-transparent",
				String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
				String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
				className
			)}
			captionLayout={captionLayout}
			formatters={{
				formatMonthDropdown: (date) =>
					date.toLocaleString("default", { month: "short" }),
				...formatters,
			}}
			classNames={{
				root: cn("w-fit max-w-sm mx-auto", defaultClassNames.root),
				months: cn(
					"flex gap-4 flex-col md:flex-row relative",
					defaultClassNames.months
				),
				month: cn(
					"flex flex-col w-full gap-4",
					defaultClassNames.month
				),
				nav: cn(
					"flex items-center gap-2 w-full absolute top-0 inset-x-0 justify-between px-2",
					defaultClassNames.nav
				),
				button_previous: cn(
					buttonVariants({ variant: "outline" }),
					"h-10 w-10 rounded-full hover:bg-purple-50 hover:border-purple-200 transition-colors duration-200 aria-disabled:opacity-30 p-0 select-none",
					defaultClassNames.button_previous
				),
				button_next: cn(
					buttonVariants({ variant: "outline" }),
					"h-10 w-10 rounded-full hover:bg-purple-50 hover:border-purple-200 transition-colors duration-200 aria-disabled:opacity-30 p-0 select-none",
					defaultClassNames.button_next
				),
				month_caption: cn(
					"flex items-center justify-center h-12 w-full px-12 mb-2",
					defaultClassNames.month_caption
				),
				dropdowns: cn(
					"w-full flex items-center text-sm font-medium justify-center h-[--cell-size] gap-1.5",
					defaultClassNames.dropdowns
				),
				dropdown_root: cn(
					"relative has-focus:border-ring border border-input shadow-xs has-focus:ring-ring/50 has-focus:ring-[3px] rounded-md",
					defaultClassNames.dropdown_root
				),
				dropdown: cn(
					"absolute bg-popover inset-0 opacity-0",
					defaultClassNames.dropdown
				),
				caption_label: cn(
					"select-none font-bold text-xl text-gray-800",
					captionLayout === "label"
						? "text-xl"
						: "rounded-md pl-2 pr-1 flex items-center gap-1 text-xl h-10 [&>svg]:text-muted-foreground [&>svg]:size-4",
					defaultClassNames.caption_label
				),
				table: "w-full border-collapse",
				weekdays: cn("flex mb-2", defaultClassNames.weekdays),
				weekday: cn(
					"text-gray-500 rounded-md flex-1 font-medium text-sm select-none h-10 flex items-center justify-center uppercase tracking-wide",
					defaultClassNames.weekday
				),
				week: cn("flex w-full gap-1 mb-1", defaultClassNames.week),
				week_number_header: cn(
					"select-none w-[--cell-size]",
					defaultClassNames.week_number_header
				),
				week_number: cn(
					"text-[0.8rem] select-none text-muted-foreground",
					defaultClassNames.week_number
				),
				day: cn(
					"relative w-full h-full p-0 text-center group/day aspect-square select-none flex-1",
					defaultClassNames.day
				),
				range_start: cn(
					"rounded-l-lg bg-purple-100",
					defaultClassNames.range_start
				),
				range_middle: cn(
					"rounded-none bg-purple-50",
					defaultClassNames.range_middle
				),
				range_end: cn(
					"rounded-r-lg bg-purple-100",
					defaultClassNames.range_end
				),
				today: cn(
					"bg-blue-50 text-blue-700 font-semibold rounded-lg border border-blue-200",
					defaultClassNames.today
				),
				outside: cn(
					"text-gray-300 aria-selected:text-gray-400",
					defaultClassNames.outside
				),
				disabled: cn(
					"text-gray-200 opacity-40 cursor-not-allowed",
					defaultClassNames.disabled
				),
				hidden: cn("invisible", defaultClassNames.hidden),
				...classNames,
			}}
			components={{
				Root: ({ className, rootRef, ...props }) => {
					return (
						<div
							data-slot="calendar"
							ref={rootRef}
							className={cn(className)}
							{...props}
						/>
					);
				},
				Chevron: ({ className, orientation, ...props }) => {
					if (orientation === "left") {
						return (
							<ChevronLeftIcon
								className={cn("size-4", className)}
								{...props}
							/>
						);
					}

					if (orientation === "right") {
						return (
							<ChevronRightIcon
								className={cn("size-4", className)}
								{...props}
							/>
						);
					}

					return (
						<ChevronDownIcon
							className={cn("size-4", className)}
							{...props}
						/>
					);
				},
				DayButton: CalendarDayButton,
				WeekNumber: ({ children, ...props }) => {
					return (
						<td {...props}>
							<div className="flex size-[--cell-size] items-center justify-center text-center">
								{children}
							</div>
						</td>
					);
				},
				...components,
			}}
			{...props}
		/>
	);
}

function CalendarDayButton({
	className,
	day,
	modifiers,
	...props
}: React.ComponentProps<typeof DayButton>) {
	const defaultClassNames = getDefaultClassNames();

	const ref = React.useRef<HTMLButtonElement>(null);
	React.useEffect(() => {
		if (modifiers.focused) ref.current?.focus();
	}, [modifiers.focused]);

	return (
		<Button
			ref={ref}
			variant="ghost"
			size="icon"
			data-day={day.date.toLocaleDateString()}
			data-selected-single={
				modifiers.selected &&
				!modifiers.range_start &&
				!modifiers.range_end &&
				!modifiers.range_middle
			}
			data-range-start={modifiers.range_start}
			data-range-end={modifiers.range_end}
			data-range-middle={modifiers.range_middle}
			className={cn(
				"data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 dark:hover:text-accent-foreground flex aspect-square w-full min-w-[--cell-size] flex-col gap-1 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] data-[range-end=true]:rounded-md data-[range-end=true]:rounded-r-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md data-[range-start=true]:rounded-l-md [&>span]:text-xs [&>span]:opacity-70",
				defaultClassNames.day,
				className
			)}
			{...props}
		/>
	);
}

export { Calendar, CalendarDayButton };
