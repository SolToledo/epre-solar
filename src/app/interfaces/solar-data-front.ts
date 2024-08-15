export interface SolarDataFront {
    annualConsumption: number,
    carbonOffsetFactorKgPerMWh: number,
    panels: {
        panelCapacityW: number,
        panelSize: {
            height: number,
            width: number
        },
        panelsCountApi:number,
        maxPanelsPerSuperface: number
    },
    tarifaCategory: string,
    yearlyEnergyAcKwh: number
}
