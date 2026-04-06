-- VotedGradeCounter.count must never go negative (application guard + DB last line of defense)
ALTER TABLE "VotedGradeCounter" ADD CONSTRAINT "votedgradecounter_count_non_negative"
  CHECK (count >= 0);

-- VoteGrade.grade must not be PENDING (only non-pending grades are valid votes)
ALTER TABLE "VoteGrade" ADD CONSTRAINT "votegrade_grade_not_pending"
  CHECK (grade != 'PENDING');

-- VotedGradeCounter.grade must not be PENDING
ALTER TABLE "VotedGradeCounter" ADD CONSTRAINT "votedgradecounter_grade_not_pending"
  CHECK (grade != 'PENDING');

-- VotedGradeStatistics.grade must not be PENDING (median must be a real grade)
ALTER TABLE "VotedGradeStatistics" ADD CONSTRAINT "votedgradestatistics_grade_not_pending"
  CHECK (grade != 'PENDING');
