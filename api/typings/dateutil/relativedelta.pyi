from datetime import date, datetime

class relativedelta(object):
    def __init__(
        self,
        dt1: datetime | date = ...,
        dt2: datetime | date = ...,
        years: int = ...,
        months: int = ...,
        daysint: int = ...,
        leapdays: int = ...,
        weeks: int = ...,
        hours: int = ...,
        minutes: int = ...,
        seconds: int = ...,
        microseconds: int = ...,
        year: int = ...,
        month: int = ...,
        day: int = ...,
        weekday: int = ...,
        yearday: int = ...,
        nlyearday: int = ...,
        hour: int = ...,
        minute: int = ...,
        second: int = ...,
        microsecond: int = ...,
    ) -> None: ...
    @property
    def months(self) -> int: ...
    @property
    def years(self) -> int: ...
