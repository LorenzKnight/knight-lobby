function PlayerAvatar({ avatarImages }) {
	return (
		<div className="player-avatar">
			{avatarImages?.cap && (
				<img
					src={avatarImages.cap}
					alt="Gorra del personaje"
					className="avatar-layer avatar-cap"
				/>
			)}

			{avatarImages?.shirt && (
				<img
					src={avatarImages.shirt}
					alt="Camiseta del personaje"
					className="avatar-layer avatar-shirt"
				/>
			)}

			<img
				src="/avatar/torsos/torso_01.png"
				alt="Torso fijo del personaje"
				className="avatar-layer avatar-torso"
			/>

			{avatarImages?.legs && (
				<img
					src={avatarImages.legs}
					alt="Piernas del personaje"
					className="avatar-layer avatar-legs"
				/>
			)}

			{avatarImages?.feets && (
				<img
					src={avatarImages.feets}
					alt="Pies del personaje"
					className="avatar-layer avatar-feets"
				/>
			)}
		</div>
	);
}

export default PlayerAvatar;