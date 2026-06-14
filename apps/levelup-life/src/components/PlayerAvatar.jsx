import head01 from "../assets/avatar/heads/head_01.png";
import head02 from "../assets/avatar/heads/head_02.png";

import torso01 from "../assets/avatar/torsos/torso_01.png";
import torso02 from "../assets/avatar/torsos/torso_02.png";

import legs01 from "../assets/avatar/legs/legs_01.png";
import legs02 from "../assets/avatar/legs/legs_02.png";
import legs03 from "../assets/avatar/legs/legs_03.png";
import legs04 from "../assets/avatar/legs/legs_04.png";
import legs05 from "../assets/avatar/legs/legs_05.png";

import feets01 from "../assets/avatar/feets/feets_01.png";
import feets02 from "../assets/avatar/feets/feets_02.png";

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
        legs_03: legs03,
		legs_04: legs04,
		legs_05: legs05,
	},
    feets: {
        feets_01: feets01,
        feets_02: feets02,
    },
};

function PlayerAvatar({
	head = "head_01",
	torso = "torso_01",
	legs = "legs_01",
	feets = "feets_01",
}) {
	const headImage = avatarParts.heads[head];
	const torsoImage = avatarParts.torsos[torso];
	const legsImage = avatarParts.legs[legs];
	const feetsImage = avatarParts.feets[feets];

	return (
		<div className="player-avatar">
            {headImage && (
				<img
					src={headImage}
					alt="Cabeza del personaje"
					className="avatar-layer avatar-head"
				/>
			)}

            {torsoImage && (
				<img
					src={torsoImage}
					alt="Torso del personaje"
					className="avatar-layer avatar-torso"
				/>
			)}

            {legsImage && (
				<img
					src={legsImage}
					alt="Piernas del personaje"
					className="avatar-layer avatar-legs"
				/>
			)}

            {feetsImage && (
				<img
					src={feetsImage}
					alt="Pies del personaje"
					className="avatar-layer avatar-feets"
				/>
			)}
		</div>
	);
}

export default PlayerAvatar;