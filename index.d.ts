interface LocalePack {
    weekDaysName : { [key: number] : string }
    monthName : { [key: number] : string }
    monthNamesShort : string[]
    back : string
}

type Week = {
    day: number
    isWeekend: boolean
    isActive: boolean
    isSelect: boolean
    isDisallow: boolean
    isStartDate: boolean
    isEndDate: boolean
    isOwn: boolean
}[]

type MonthMatrix = {id : number, name: string, active: boolean}[][]

type YearsMatrix = { year: number, active: boolean }[][]

export {
    LocalePack, Week, MonthMatrix, YearsMatrix
}
