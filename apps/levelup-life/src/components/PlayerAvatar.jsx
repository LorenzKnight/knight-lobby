function PlayerAvatar({ 
	avatarImages,
	expression = "neutral",
	eyeColor = "#9b4e12",
	lookX = 0,
	lookY = 0,
	blinking = true,
}) {

	const eyesStyle = {
		"--eye-color": eyeColor,
		"--look-x": `${lookX}px`,
		"--look-y": `${lookY}px`,
	};

	return (
		<div className="player-avatar">
			{/* {avatarImages?.cap && (
				<img
					src={avatarImages.cap}
					alt="Gorra del personaje"
					className="avatar-layer avatar-cap"
				/>
			)} */}

			<div
				className={[
					"avatar-eyes",
					`expression-${expression}`,
					blinking ? "is-blinking" : "",
				].join(" ")}
				style={eyesStyle}
			>
				<AvatarEye side="left" />
				<AvatarEye side="right" />
			</div>

			{avatarImages?.cap && (
				<img
					src={avatarImages.cap}
					alt="Gorra del personaje"
					className="avatar-layer avatar-cap"
				/>
			)}

			<div className="avatar-light-ring" />
			
			<img
				src="/avatar/torsos/body_01.png"
				alt="Cuerpo fijo del personaje"
				className="avatar-body"
			/>

			{avatarImages?.shirt && (
				<img
					src={avatarImages.shirt}
					alt="Shirt"
					className="avatar-layer avatar-shirt"
				/>
			)}

			{/* {avatarImages?.legs && (
				<img
					src={avatarImages.legs}
					alt="Piernas del personaje"
					className="avatar-layer avatar-legs"
				/>
			)} */}

			{/* {avatarImages?.feets && (
				<img
					src={avatarImages.feets}
					alt="Pies del personaje"
					className="avatar-layer avatar-feets"
				/>
			)} */}
		</div>
	);
}

function AvatarEye({ side }) {
	return (
		<div className={`eye eye-${side}`}>
			<div className="eye-white">
				<div className="iris">
					<div className="iris-glow" />
					<div className="pupil" />

					<div className="eye-highlight eye-highlight-main" />
					<div className="eye-highlight eye-highlight-small" />
				</div>

				<div className="upper-eyelid" />
				<div className="lower-eyelid" />
			</div>

			
			<div className="eyebrow" />
		</div>
	);
}

export default PlayerAvatar;