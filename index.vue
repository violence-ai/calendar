<template>
    <div class="calendar" :class="css">

        <!-- Навигиация -->
        <div class="header">
            <!-- Предыдущий -->
            <div class="nav-btn" @click="prev()">
                <i class="fal fa-angle-left"></i>
            </div>
            <!-- Заголовки (в зависимости от навигации) -->
            <div class="title" :class="[mode === Mode.years ? 'no-click' : '']" @click="changePage()">{{ title }}</div>
            <!-- Следующий -->
            <div class="nav-btn" @click="next()">
                <i class="fal fa-angle-right"></i>
            </div>
        </div>

        <!-- Года -->
        <div class="years-block" v-if="mode === Mode.years">
            <div class="rows">
                <div class="row" v-for="yearRow in yearList">
                    <div class="name"
                         v-for="year in yearRow"
                         :class="{ active : year.active }"
                         @click="changeYear(year.year)"
                    >{{ year.year }}</div>
                </div>
            </div>
            <button class="btn-hide" @click="back()">{{ localePack.back }}</button>
        </div>

        <!-- Месяцы -->
        <div class="months-block" v-if="mode === Mode.months">
            <div class="rows">
                <div class="row" v-for="monthsRow in monthsList">
                    <div class="name"
                         v-for="month in monthsRow"
                         :class="{ active : month.active }"
                         @click="changeMonth(month.id)"
                    >{{ month.name  }}</div>
                </div>
            </div>
            <button class="btn-hide" @click="back()">{{ localePack.back }}</button>
        </div>

        <!-- Дни -->
        <div class="dates-block" v-if="mode === Mode.days">
            <div class="week-names">
                <div class="week-name" v-for="weekId in orderWeekDayId">
                    {{ localePack.weekDaysName[weekId] }}
                </div>
            </div>
            <div class="dates">
                <div class="week" v-for="week in weeks">
                    <template v-for="day in week">
                        <div class="day"
                             :class="{ weekend : day.isWeekend, active : day.isActive, select : day.isSelect, disallow : day.isDisallow, start : day.isStartDate, end : day.isEndDate, own: !day.isOwn }"
                             @click="changeDay(day.day, day.isDisallow, day.isOwn)">
                            <span>{{ day.day }}</span>
                        </div>
                    </template>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">

import Component from "vue-class-component"
import {Prop, Vue, Watch} from "vue-property-decorator"
import { Week, LocalePack, MonthMatrix, YearsMatrix } from './index'

enum Mode {
    days,
    months,
    years
}

@Component
export default class Calendar extends Vue {

    Mode = Mode

    @Prop(String) readonly css!: string
    @Prop(String) readonly date!: string
    @Prop(String) readonly linkFromDate!: string
    @Prop(String) readonly linkToDate!: string
    @Prop(String) readonly format!: string
    @Prop(Boolean) readonly autoCloseState!: boolean

    // private localePack: LocalePack = {
    //     weekDaysName : {
    //         0 : 'Sun',
    //         1 : 'Mon',
    //         2 : 'Tue',
    //         3 : 'Wed',
    //         4 : 'Thu',
    //         5 : 'Fri',
    //         6 : 'Sat',
    //     },
    //     monthName : {
    //         0 : 'January',
    //         1 : 'February',
    //         2 : 'March',
    //         3 : 'April',
    //         4 : 'May',
    //         5 : 'June',
    //         6 : 'July',
    //         7 : 'August',
    //         8 : 'September',
    //         9 : 'October',
    //         10 : 'November',
    //         11 : 'December',
    //     },
    //     monthNamesShort : [
    //         'Jan',
    //         'Feb',
    //         'Mar',
    //         'Apr',
    //         'May',
    //         'Jun',
    //         'Jul',
    //         'Aug',
    //         'Sep',
    //         'Oct',
    //         'Nov',
    //         'Dec',
    //     ],
    //     back : 'Cancel',
    // }

    private localePack: LocalePack = {
        weekDaysName : {
            0 : this.__('main.calendarPlugin.weekDaysName.Sun'),
            1 : this.__('main.calendarPlugin.weekDaysName.Mon'),
            2 : this.__('main.calendarPlugin.weekDaysName.Tue'),
            3 : this.__('main.calendarPlugin.weekDaysName.Wed'),
            4 : this.__('main.calendarPlugin.weekDaysName.Thu'),
            5 : this.__('main.calendarPlugin.weekDaysName.Fri'),
            6 : this.__('main.calendarPlugin.weekDaysName.Sat'),
        },
        monthName : {
            0 : this.__('main.calendarPlugin.monthName.January'),
            1 : this.__('main.calendarPlugin.monthName.February'),
            2 : this.__('main.calendarPlugin.monthName.March'),
            3 : this.__('main.calendarPlugin.monthName.April'),
            4 : this.__('main.calendarPlugin.monthName.May'),
            5 : this.__('main.calendarPlugin.monthName.June'),
            6 : this.__('main.calendarPlugin.monthName.July'),
            7 : this.__('main.calendarPlugin.monthName.August'),
            8 : this.__('main.calendarPlugin.monthName.September'),
            9 : this.__('main.calendarPlugin.monthName.October'),
            10 : this.__('main.calendarPlugin.monthName.November'),
            11 : this.__('main.calendarPlugin.monthName.December'),
        },
        monthNamesShort : [
            this.__('main.calendarPlugin.monthNamesShort.Jan'),
            this.__('main.calendarPlugin.monthNamesShort.Feb'),
            this.__('main.calendarPlugin.monthNamesShort.Mar'),
            this.__('main.calendarPlugin.monthNamesShort.Apr'),
            this.__('main.calendarPlugin.monthNamesShort.May'),
            this.__('main.calendarPlugin.monthNamesShort.Jun'),
            this.__('main.calendarPlugin.monthNamesShort.Jul'),
            this.__('main.calendarPlugin.monthNamesShort.Aug'),
            this.__('main.calendarPlugin.monthNamesShort.Sep'),
            this.__('main.calendarPlugin.monthNamesShort.Oct'),
            this.__('main.calendarPlugin.monthNamesShort.Nov'),
            this.__('main.calendarPlugin.monthNamesShort.Dec'),
        ],
        back : this.__('main.calendarPlugin.back')
    }

    /** Первый день недели */
    private startWeekDayId: number = 1 // Monday

    /** Текущий мод */
    private mode: Mode = Mode.days
    /** Текущая дата */
    private currentDate: Date | null = null
    /** Текущий отображающийся месяц/год месяц/год */
    private displayMonthDate: Date | null = null

    private currentLinkFromDate: Date | null = null
    private currentLinkToDate: Date | null = null


    @Watch('date')
    onDateChange() {
        this.setData()
    }

    @Watch('linkFromDate')
    onLinkFromDateChange() {
        this.setData()
    }

    @Watch('linkToDate')
    onLinkToDateChange() {
        this.setData()
    }

    beforeMount() {

        this.setData()
    }

    /************************
     * Getters
     ************************/

    /** Возвращает заголовок в зависимости от модификатора отображения */
    get title() {

        if ( this.mode === Mode.days )
        {
            return this.localePack.monthName[this.getDisplayMonthDate.getMonth()] + ' ' + this.getDisplayMonthDate.getFullYear()
        }
        else if ( this.mode === Mode.months )
        {
            return this.getDisplayMonthDate.getFullYear()
        }
        else if ( this.mode === Mode.years )
        {
            return `${this.yearRange.start}-${this.yearRange.end}`
        }
    }
    /** Возвращает текущий отображаемый месяц */
    get getDisplayMonthDate() {
        return this.displayMonthDate === null ? new Date() : this.displayMonthDate
    }
    /** Возвращает текущую дату */
    get getCurrentDate() {
        return this.currentDate === null ? new Date() : this.currentDate
    }
    /** Возвращает отсортированный список дней недели */
    get orderWeekDayId() {

        let start = []
        let end = []

        for ( let week_id=0; week_id<=6; week_id++ )
        {
            if ( week_id >= this.startWeekDayId )
            {
                start.push(week_id)
            }
            else
            {
                end.push(week_id)
            }
        }

        return start.concat(end)
    }

    /** Возвращает дни для конкретного месяца */
    get weeks(): Week[] {

        // список недель для отображения
        let weeks: Week[] = []

        // обработка исключения
        if ( this.displayMonthDate === null )
        {
            throw new Error('displayMonthDate null')
        }

        // дней в месяце
        let daysInMonth = 33 - new Date(this.displayMonthDate.getFullYear(), this.displayMonthDate.getMonth(), 33).getDate()

        // вычисляем стартовую дату для отображения
        let firstDayId = new Date(this.displayMonthDate.setDate(1)).getDay()
        let prependDays = this.orderWeekDayId.indexOf(firstDayId)
        let startDate = this.correctDate(this.displayMonthDate, 0, 0, -prependDays)

        // вычисляем конечную дату для отображения
        let lastDayId = new Date(this.displayMonthDate.setDate(daysInMonth)).getDay()
        let appendDays = 6 - this.orderWeekDayId.indexOf(lastDayId)
        let endDate = this.correctDate(this.displayMonthDate, 0, 0, appendDays)

        // вычисляем кол-во необходимых итераций
        let iterators = (endDate.getTime() - startDate.getTime()) / 1000 / (3600*24)

        // итерируем
        for ( let i=0; i<=iterators; i++ )
        {
            // обрабатываемая дата
            let dayDate = this.correctDate(startDate, 0, 0, i)
            // число месяца
            let day = dayDate.getDate()
            // день числа
            let weekDayId = dayDate.getDay()

            // временная метка "текущего обрабатыаемого дня"
            let timeDay = dayDate.getTime()

            // это выходной день (суббота/воскресенье)
            let isWeekend = [0,6].includes(weekDayId)
            // выделен как активный или выбранный?
            let isActive = this.currentDate !== null && this.currentDate.getTime() === timeDay
            // входит в период дат?
            let isSelect = false
            // запрещен для клика? - да для дат пересекающихся в противоположном направлении
            let isDisallow = false

            let isStartDate = false
            let isEndDate = false

            let isOwn = dayDate.getMonth() === this.displayMonthDate.getMonth()

            if ( this.isFrom && this.currentLinkToDate !== null && this.currentDate !== null )
            {
                // временная метка "от"
                let timeFrom = this.currentDate.getTime()
                // временная метка "до"
                let timeTo = this.currentLinkToDate.getTime()

                isSelect = !isActive && timeDay >= timeFrom && timeDay <= timeTo
                isDisallow = timeDay > timeTo

                isStartDate = timeFrom === timeDay
                isEndDate = timeTo === timeDay
            }
            else if ( this.isTo && this.currentLinkFromDate !== null && this.currentDate !== null )
            {
                // временная метка "от"
                let timeFrom = this.currentLinkFromDate.getTime()
                // временная метка "до"
                let timeTo = this.currentDate.getTime()

                isSelect = !isActive && timeDay >= timeFrom && timeDay <= timeTo
                isDisallow = timeDay < timeFrom

                isStartDate = timeFrom === timeDay
                isEndDate = timeTo === timeDay
            }

            if ( !weeks[weeks.length-1] || weeks[weeks.length-1].length === 7 )
            {
                weeks[weeks.length] = []
            }

            // сформировать данные
            weeks[weeks.length-1].push({
                day,
                isWeekend,
                isActive,
                isSelect,
                isDisallow,
                isStartDate,
                isEndDate,
                isOwn
            })
        }

        // вернуть данные
        return weeks
    }
    /** Возвращает имена месяцов в матрице 4х3 */
    get monthsList(): MonthMatrix {

        let matrix: MonthMatrix = []

        this.localePack.monthNamesShort.forEach((monthName, monthId) => {

            if ( matrix.length === 0 || matrix[matrix.length-1].length === 4 )
            {
                matrix.push([])
            }

            matrix[matrix.length-1].push({
                id : monthId,
                name : monthName,
                active : monthId === this.getCurrentDate.getMonth() && this.getDisplayMonthDate.getFullYear() === this.getCurrentDate.getFullYear(),
            })
        })

        return matrix
    }
    /** Возвращает "страницу со списоком годов" в которой находится конкретный год */
    get yearRange() {

        if ( this.displayMonthDate === null ) {
            throw new Error('displayMonthDate null')
        }

        // сдвиг на 100 лет.
        // Года ниже 100 не будут отображаться
        let shift = 100
        // кол-во годов на странице
        let cntOnPage = 12
        // текущий выбранный год для отображения
        let year = this.displayMonthDate.getFullYear()

        // определить номер страницы по году
        let page = Math.floor((year-shift)/cntOnPage)

        // начинать с года
        let startYear = shift + (page * cntOnPage)
        // заканчивать на год
        let endYear = startYear + cntOnPage - 1

        return {
            start : startYear,
            end : endYear,
        }
    }
    /** Возвращает список годов в виде матрицы 4x3 для конкретной страницы */
    get yearList(): YearsMatrix {

        let range = this.yearRange

        let matrix: YearsMatrix = []

        for ( let year=range.start; year<=range.end; year++ )
        {
            if ( matrix.length === 0 || matrix[matrix.length-1].length === 4 )
            {
                matrix.push([])
            }

            matrix[matrix.length-1].push({
                year : year,
                active : year === this.getCurrentDate.getFullYear(),
            })
        }

        return matrix
    }
    /** Определяет является ли этот календарь "от" */
    get isFrom() {
        return this.$props.linkToDate !== undefined
    }
    /** Определяет является ли этот календарь "до" */
    get isTo() {
        return this.$props.linkFromDate !== undefined
    }
    //
    /** Устанавливает начальные входные данные */
    setData() {

        let regexp = this.format.replace('%d', '\\d+').replace('%m', '\\d+').replace('%y', '\\d+').replace(/\./g, '\\.');

        if ( !new RegExp(`^${regexp}$`).test(this.date) ) {
            this.currentDate = null
            this.displayMonthDate = new Date()
        } else {
            this.currentDate = this.dateStringToDate(this.date)
            this.displayMonthDate = this.dateStringToDate(this.date)
        }

        if ( this.isFrom && new RegExp(`^${regexp}$`).test(this.linkToDate) ) {
            this.currentLinkToDate = this.dateStringToDate(this.linkToDate)
        }

        if ( this.isTo && new RegExp(`^${regexp}$`).test(this.linkFromDate) ) {
            this.currentLinkFromDate = this.dateStringToDate(this.linkFromDate)
        }
    }
    /** Конвертирует строковое представление даты в объект даты (в соотвествии с указаным шаблоном/форматом) */
    dateStringToDate(date: string) {

        let regexpY = this.format.replace('%d', '\\d+').replace('%m', '\\d+').replace('%y', '(\\d+)').replace(/\./g, '\\.')
        let regexpM = this.format.replace('%d', '\\d+').replace('%m', '(\\d+)').replace('%y', '\\d+').replace(/\./g, '\\.')
        let regexpD = this.format.replace('%d', '(\\d+)').replace('%m', '\\d+').replace('%y', '\\d+').replace(/\./g, '\\.')

        let y_res = new RegExp(`^${regexpY}$`).exec(date)
        let m_res = new RegExp(`^${regexpM}$`).exec(date)
        let d_res = new RegExp(`^${regexpD}$`).exec(date)

        let y = y_res ? parseInt(y_res[1]) : new Date().getFullYear()
        let m = m_res ? parseInt(m_res[1])-1 : new Date().getMonth()-1
        let d = d_res ? parseInt(d_res[1]) : new Date().getDate()

        return new Date(y, m, d, 0, 0, 0, 0)
    }
    /** Конвертирует объект даты в строковое представление даты (в соотвествии с указаным шаблоном/форматом) */
    dateFormatted(date: Date) {

        return this.$props.format.replace('%d', this.addLeadingZeros(date.getDate()))
                                    .replace('%m', this.addLeadingZeros(date.getMonth()+1))
                                    .replace('%y', date.getFullYear())
    }
    /** Добавляет ведущие нули для 2-х значных чисел */
    addLeadingZeros(str: any) {
        return str.toString().length === 1 ? "0" + str : str
    }
    /** Нажатие на кнопку "предыдущий" */
    prev() {

        // обработка исключения
        if ( this.displayMonthDate === null )
        {
            throw new Error('displayMonthDate null')
        }

        // текущая страница
        let mode = this.mode

        // если страница с днями
        if ( mode === Mode.days )
        {
            // уменьшаем месяц на 1
            this.displayMonthDate = new Date(
                this.displayMonthDate.getFullYear(),
                this.displayMonthDate.getMonth()-1,
                1
            )
        }
        // если страница с названием месяцев
        else if ( mode === Mode.months )
        {
            // уменьшаем год на 1
            this.displayMonthDate = new Date(
                this.displayMonthDate.getFullYear()-1,
                this.displayMonthDate.getMonth(),
                1
            )
        }
        // если страница с годами
        else if ( mode === Mode.years )
        {
            // уменьшаем на 12 лет
            let y = this.displayMonthDate.getFullYear()-12

            // не разрешаем опускаться ниже предела 100 годов
            if ( y < 100 )
            {
                this.displayMonthDate = new Date(
                    100,
                    this.displayMonthDate.getMonth(),
                    1
                )
            }
            else
            {
                this.displayMonthDate = new Date(
                    this.displayMonthDate.getFullYear()-12,
                    this.displayMonthDate.getMonth(),
                    1
                )
            }
        }
    }
    /** Нажатие на кнопку "следующий" */
    next() {

        // обработка исключения
        if ( this.displayMonthDate === null )
        {
            throw new Error('displayMonthDate null')
        }

        // текущий мод
        let mode = this.mode

        // если страница с днями
        if ( mode === Mode.days )
        {
            // увеличиваем месяц на 1
            this.displayMonthDate = new Date(
                this.displayMonthDate.getFullYear(),
                this.displayMonthDate.getMonth()+1,
                1
            )
        }
        // если страница с названием месяцев
        else if ( mode === Mode.months )
        {
            // увеличиваем год на 1
            this.displayMonthDate = new Date(
                this.displayMonthDate.getFullYear()+1,
                this.displayMonthDate.getMonth(),
                1
            )
        }
        // если страница с годами
        else if ( mode === Mode.years )
        {
            // увеличиваем на 12 годов
            this.displayMonthDate = new Date(
                this.displayMonthDate.getFullYear()+12,
                this.displayMonthDate.getMonth(),
                1
            )
        }
    }
    /** Меняет страницу при нажатии на "заголовок" в зависимости от модификатора отображения */
    changePage() {

        // со страницы с днями
        if ( this.mode === Mode.days )
        {
            // переходим к странице с названием месяцов
            this.mode = Mode.months
        }
        // со страницы с названиями месяцов
        else if ( this.mode === Mode.months )
        {
            // переходим на страницу с годами
            this.mode = Mode.years
        }
    }
    /** Меняет день при нажатии на "день" */
    changeDay(day: number, disallow: boolean, own: boolean) {

        // обработка исключения
        if ( this.displayMonthDate === null )
        {
            throw new Error('displayMonthDate null')
        }

        // запретить выполнение, если день недоступен для нажатия
        if ( disallow || !own ) return

        // меняем текущую установленную дату
        this.currentDate = new Date(new Date(this.displayMonthDate.getTime()).setDate(day))

        // если включено автоматическое закрытие при клике
        if ( this.$props.autoCloseState )
        {
            // закрываем
            this.$emit('close')
        }

        // излучим новую дату
        this.$emit('update:date', this.dateFormatted(this.currentDate))
    }
    /** Меняет отображаемый месяц при нажатии на "месяц"  */
    changeMonth(monthId: number) {

        // обработка исключения
        if ( this.displayMonthDate === null )
        {
            throw new Error('displayMonthDate null')
        }

        // меняем отображаемый месяц
        this.displayMonthDate = new Date(this.displayMonthDate.setMonth(monthId))

        // возвращаемся на странцу с днями
        this.mode = Mode.days
    }
    /** Меняет отображаемый год при нажатии на "год" */
    changeYear(year: number) {

        // обработка исключения
        if ( this.displayMonthDate === null )
        {
            throw new Error('displayMonthDate null')
        }

        // меняем отображаемый год
        this.displayMonthDate = new Date(this.displayMonthDate.setFullYear(year))

        // возвращаемся на странцу с месяцами
        this.mode = Mode.months
    }
    /** Возвращает назад на страницу с днями */
    back() {

        // обработка исключения
        if ( this.displayMonthDate === null )
        {
            throw new Error('displayMonthDate null')
        }

        // обработка исключения
        if ( this.currentDate === null )
        {
            throw new Error('currentDate null')
        }

        // вернуть назад
        this.mode = Mode.days

        // вернуть отображаемые год/месяц на установленные
        this.displayMonthDate.setFullYear(this.currentDate.getFullYear())
        this.displayMonthDate.setMonth(this.currentDate.getMonth())
    }

    correctDate(date: Date, year: number = 0, month: number = 0, day: number = 0, hours: number = 0, minutes: number = 0, seconds: number = 0): Date {

        return new Date(
            date.getFullYear() + year,
            date.getMonth() + month,
            date.getDate() + day,
            date.getHours() + hours,
            date.getMinutes() + minutes,
            date.getSeconds() + seconds,
        )
    }
}

</script>

<style scoped>

</style>
