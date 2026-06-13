import head01 from "../assets/avatar/heads/head_01.png";
import head02 from "../assets/avatar/heads/head_02.png";

import torso01 from "../assets/avatar/torsos/torso_01.png";
import torso02 from "../assets/avatar/torsos/torso_02.png";

import legs01 from "../assets/avatar/legs/legs_01.png";
import legs02 from "../assets/avatar/legs/legs_02.png";

import base01 from "../assets/avatar/bases/base_01.png";
import base02 from "../assets/avatar/bases/base_02.png";

const avatarParts = {
	heads: {
		head_01: head01,
		head_02: head02,
	},
	torsos: {
		torso_01: torso01,
		torso_02: torso02,
	},
	legs: {
		legs_01: legs01,
		legs_02: legs02,
	},
	bases: {
		base_01: base01,
		base_02: base02,
	},
};

function PlayerAvatar({
	head = "head_01",
	torso = "torso_01",
	legs = "legs_01",
	base = "base_01",
}) {
	const headImage = avatarParts.heads[head];
	const torsoImage = avatarParts.torsos[torso];
	const legsImage = avatarParts.legs[legs];
	const baseImage = avatarParts.bases[base];

	return (
		<div className="player-avatar">
			{baseImage && (
				<img
					src={baseImage}
					alt="Base del personaje"
					className="avatar-layer avatar-base"
				/>
			)}

			{legsImage && (
				<img
					src={legsImage}
					alt="Piernas del personaje"
					className="avatar-layer avatar-legs"
				/>
			)}

			{torsoImage && (
				<img
					src={torsoImage}
					alt="Torso del personaje"
					className="avatar-layer avatar-torso"
				/>
			)}

			{headImage && (
				<img
					src={headImage}
					alt="Cabeza del personaje"
					className="avatar-layer avatar-head"
				/>
			)}
		</div>
	);
}

export default PlayerAvatar;