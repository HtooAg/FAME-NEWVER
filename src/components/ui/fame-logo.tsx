import React from "react";

interface FameLogoProps {
	width?: number;
	height?: number;
	className?: string;
}

export function FameLogo({
	width = 120,
	height = 120,
	className = "",
}: FameLogoProps) {
	return (
		<div className={`inline-flex items-center justify-center ${className}`}>
			<div
				className="relative rounded-3xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-2xl"
				style={{ width, height }}
			>
				<div className="text-white font-bold text-center leading-none">
					<div className="text-4xl font-black tracking-tighter">
						FA
					</div>
					<div className="text-4xl font-black tracking-tighter -mt-2">
						ME
					</div>
				</div>
			</div>
		</div>
	);
}
