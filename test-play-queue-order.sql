SELECT
	id,
	PartyId,
	name,
	`status`,
	voteCount,
	createdAt,
	updatedAt,
	CONCAT(
		(CASE `status`
			WHEN 'playing' THEN '10'
			WHEN 'paused'  THEN '10'
			WHEN 'queued'  THEN '20'
			WHEN 'ended'   THEN '30'
		END),
		LPAD(HEX(65535 - voteCount), 4, 0),
		LPAD(HEX(UNIX_TIMESTAMP(createdAt)), 8, 0)
	) AS sortableHash
FROM songs
WHERE partyId = 2
ORDER BY sortableHash

