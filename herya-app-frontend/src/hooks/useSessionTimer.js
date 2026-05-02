import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Robust session timer that handles:
 * - Global session countdown and per-block countdown
 * - Pause/resume with accurate elapsed time tracking
 * - Block transitions
 */
export default function useSessionTimer(blocks = []) {
	const [isRunning, setIsRunning] = useState(false);
	const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
	const [globalElapsedSec, setGlobalElapsedSec] = useState(0);
	const [blockElapsedSec, setBlockElapsedSec] = useState(0);
	const intervalRef = useRef(null);
	const startTimeRef = useRef(null);
	const blockStartTimeRef = useRef(null);
	const globalOffsetRef = useRef(0);
	const blockOffsetRef = useRef(0);

	const totalPlannedSec = blocks.reduce(
		(sum, b) => sum + (b.durationMinutes || 0) * 60,
		0,
	);

	const currentBlock = blocks[currentBlockIndex] || null;
	const currentBlockDurationSec = (currentBlock?.durationMinutes || 0) * 60;
	const globalRemainingSec = Math.max(0, totalPlannedSec - globalElapsedSec);
	const blockRemainingSec = Math.max(
		0,
		currentBlockDurationSec - blockElapsedSec,
	);
	const globalProgress =
		totalPlannedSec > 0
			? Math.min(100, Math.round((globalElapsedSec / totalPlannedSec) * 100))
			: 0;
	const blockProgress =
		currentBlockDurationSec > 0
			? Math.min(
					100,
					Math.round((blockElapsedSec / currentBlockDurationSec) * 100),
				)
			: 0;

	const tick = useCallback(() => {
		const now = Date.now();
		if (startTimeRef.current != null) {
			setGlobalElapsedSec(
				Math.floor((now - startTimeRef.current) / 1000) +
					globalOffsetRef.current,
			);
		}
		if (blockStartTimeRef.current != null) {
			setBlockElapsedSec(
				Math.floor((now - blockStartTimeRef.current) / 1000) +
					blockOffsetRef.current,
			);
		}
	}, []);

	useEffect(() => {
		if (isRunning) {
			intervalRef.current = setInterval(tick, 250);
		} else {
			clearInterval(intervalRef.current);
		}
		return () => clearInterval(intervalRef.current);
	}, [isRunning, tick]);

	// Auto-advance block when block time expires
	useEffect(() => {
		if (!isRunning || !currentBlock) return;
		if (
			blockElapsedSec >= currentBlockDurationSec &&
			currentBlockDurationSec > 0
		) {
			if (currentBlockIndex < blocks.length - 1) {
				goToBlock(currentBlockIndex + 1);
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [blockElapsedSec, currentBlockDurationSec, isRunning]);

	const start = useCallback(() => {
		const now = Date.now();
		if (!startTimeRef.current) {
			startTimeRef.current = now;
			blockStartTimeRef.current = now;
		}
		setIsRunning(true);
	}, []);

	const pause = useCallback(() => {
		if (!isRunning) return;
		// Save current elapsed as offset so we can resume accurately
		const now = Date.now();
		if (startTimeRef.current != null) {
			globalOffsetRef.current += Math.floor(
				(now - startTimeRef.current) / 1000,
			);
		}
		if (blockStartTimeRef.current != null) {
			blockOffsetRef.current += Math.floor(
				(now - blockStartTimeRef.current) / 1000,
			);
		}
		startTimeRef.current = null;
		blockStartTimeRef.current = null;
		setIsRunning(false);
	}, [isRunning]);

	const resume = useCallback(() => {
		const now = Date.now();
		startTimeRef.current = now;
		blockStartTimeRef.current = now;
		setIsRunning(true);
	}, []);

	const goToBlock = useCallback(
		(idx) => {
			const clamped = Math.max(0, Math.min(idx, blocks.length - 1));
			setCurrentBlockIndex(clamped);
			blockOffsetRef.current = 0;
			setBlockElapsedSec(0);
			if (isRunning) {
				blockStartTimeRef.current = Date.now();
			} else {
				blockStartTimeRef.current = null;
			}
		},
		[blocks.length, isRunning],
	);

	const nextBlock = useCallback(() => {
		if (currentBlockIndex < blocks.length - 1) {
			goToBlock(currentBlockIndex + 1);
		}
	}, [currentBlockIndex, blocks.length, goToBlock]);

	const prevBlock = useCallback(() => {
		if (currentBlockIndex > 0) {
			goToBlock(currentBlockIndex - 1);
		}
	}, [currentBlockIndex, goToBlock]);

	const reset = useCallback(() => {
		setIsRunning(false);
		clearInterval(intervalRef.current);
		startTimeRef.current = null;
		blockStartTimeRef.current = null;
		globalOffsetRef.current = 0;
		blockOffsetRef.current = 0;
		setGlobalElapsedSec(0);
		setBlockElapsedSec(0);
		setCurrentBlockIndex(0);
	}, []);

	const isLastBlock = currentBlockIndex >= blocks.length - 1;
	const isFirstBlock = currentBlockIndex === 0;

	return {
		isRunning,
		currentBlockIndex,
		currentBlock,
		globalElapsedSec,
		blockElapsedSec,
		totalPlannedSec,
		globalRemainingSec,
		blockRemainingSec,
		globalProgress,
		blockProgress,
		isLastBlock,
		isFirstBlock,
		start,
		pause,
		resume,
		nextBlock,
		prevBlock,
		goToBlock,
		reset,
	};
}
