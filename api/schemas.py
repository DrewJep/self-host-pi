from typing import Optional

from pydantic import BaseModel, Field


class MovieSubmission(BaseModel):
    title: str = Field(..., min_length=1)
    director: str = Field(..., min_length=1)
    submitted_by: Optional[str] = None


class VoteSubmission(BaseModel):
    movie_id: int
    reviewer_name: Optional[str] = None
    score_story: int = Field(..., ge=1, le=5)
    score_characters: int = Field(..., ge=1, le=5)
    score_cinematography: int = Field(..., ge=1, le=5)
    score_overall: int = Field(..., ge=1, le=5)


class SubmissionLockUpdate(BaseModel):
    open: bool
