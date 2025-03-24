package models

type Candidate struct {
	PositionName string   `json:"position_name"`
	Name         string   `json:"name"`
	Position     string   `json:"position"`
	YearLevel    string   `json:"year_level"`
	Program      string   `json:"program"`
	Credentials  []string `json:"credentials"`
	PhotoURL     string   `json:"photo_url"`
	Partylist    string   `json:"partylist"`
}

type Voter struct {
	FingerprintHash string `json:"fingerprint_hash"`
	StudentID       string `json:"student_id"`
	StudentName     string `json:"student_name"`
	Program         string `json:"program"`
	HasVoted        bool   `json:"has_voted"`
}

type ExcelVoters struct {
	StudentID   string
	StudentName string
	Program     string
	HasVoted    bool
}

type Votes struct {
	GovernorVote     string `json:"governor_vote"`
	ViceGovernorVote string `json:"vice_governor_vote"`
	BoardMemberVote  string `json:"board_member_vote"`
	Program          string `json:"program"`
	StudentID        string `json:"student_id"`
}

type ExcelVotes struct {
	PositionName string
	Name         string
	Position     string
	COEVotes     int
	CBAVotes     int
	CICSVotes    int
	CITVotes     int
	COEDBSED     int
	COEDBEED     int
	COEDBPED     int
	COEDVotes    int
	TotalVotes   int
}

type Timeframe struct {
	StartTime string `json:"start_time"`
	EndTime   string `json:"end_time"`
	IsActive  bool   `json:"is_active"`
}

type Signin struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type ChangePassword struct {
	OldPassword string `json:"old_password"`
	NewPassword string `json:"new_password"`
}

type PostCandidatesPayload struct {
	GovernorCandidates        []Candidate `json:"governorCandidates"`
	ViceGovernorCandidates    []Candidate `json:"viceGovernorCandidates"`
	BeedCandidates            []Candidate `json:"beedCandidates"`
	BpedBtledBtvdedCandidates []Candidate `json:"bpedBtledBtvdedCandidates"`
	BitCandidates             []Candidate `json:"bitCandidates"`
	BsitCandidates            []Candidate `json:"bsitCandidates"`
	BsedCandidates            []Candidate `json:"bsedCandidates"`
	CbaCandidates             []Candidate `json:"cbaCandidates"`
	CoeCandidates             []Candidate `json:"coeCandidates"`
	PartylistLeft             string      `json:"partylistLeft"`
	PartylistRight            string      `json:"partylistRight"`
}

type ExcelElectionSetting struct {
	VotingStart string
	VotingEnd   string
}
