const MOOD_FACE_CONFIG = {
	neutral: {
		eyes: "neutral",
		mouth: "neutral",
	},

	good: {
		eyes: "calm",
		mouth: "soft-smile",
	},

	ahead: {
		eyes: "confident",
		mouth: "smile",
	},

	completed: {
		eyes: "happy",
		mouth: "big-smile",
	},

	behind: {
		eyes: "worried",
		mouth: "uneasy",
	},

	danger: {
		eyes: "sad",
		mouth: "sad",
	},

	critical: {
		eyes: "stressed",
		mouth: "open-worried",
	},

	sleeping: {
		eyes: "sleeping",
		mouth: "relaxed",
	},
};

function getMoodFaceConfig(mood) {
	return MOOD_FACE_CONFIG[mood] ?? MOOD_FACE_CONFIG.neutral;
}

function PlayerAvatar({ 
	avatarImages,

	mood = "neutral",
	eyeExpression,
	mouthExpression,

	eyeColor = "#9b4e12",
	lookX = 0,
	lookY = 0,
	blinking = true,
}) {
	const moodFaceConfig = getMoodFaceConfig(mood);

	const currentEyeExpression = eyeExpression ?? moodFaceConfig.eyes;
	const currentMouthExpression = mouthExpression ?? moodFaceConfig.mouth;

	const eyesStyle = {
		"--eye-color": eyeColor,
		"--look-x": `${lookX}px`,
		"--look-y": `${lookY}px`,
	};

	return (
		<div
			className={[
				"player-avatar",
				`mood-${mood}`,
				`eyes-${currentEyeExpression}`,
				`mouth-${currentMouthExpression}`,
			].join(" ")}
		>
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
					`expression-${currentEyeExpression}`,
					blinking ? "is-blinking" : "",
				].join(" ")}
				style={eyesStyle}
			>
				<AvatarEye side="left" />
				<AvatarEye side="right" />
			</div>

			<AvatarMouth expression={currentMouthExpression} />

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

			{avatarImages?.legs && (
				<img
					src={avatarImages.legs}
					alt="Pants"
					className="avatar-layer avatar-legs"
				/>
			)}

			{avatarImages?.feets && (
				<img
					src={avatarImages.feets}
					alt="Feets"
					className="avatar-layer avatar-feets"
				/>
			)}
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

function AvatarMouth({ expression = "neutral" }) {
	return (
		<div className={`avatar-mouth mouth-${expression}`}>
			<div className="mouth-line" />
		</div>
	);
}

export default PlayerAvatar;