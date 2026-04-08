export default function Toggle({ id, label, checked, onChange }) {
	return (
		<label
			htmlFor={id}
			className="relative inline-flex items-center cursor-pointer"
		>
			<input
				id={id}
				type="checkbox"
				checked={checked}
				onChange={onChange}
				className="sr-only"
				aria-label={label}
			/>
			<div
				className="w-11 h-6 rounded-full transition-colors duration-200 relative"
				style={{
					backgroundColor: checked
						? "var(--color-primary)"
						: "var(--color-border)",
				}}
			>
				<span
					className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200"
					style={{
						transform: checked ? "translateX(20px)" : "translateX(0px)",
					}}
				/>
			</div>
		</label>
	);
}
