export interface SolarDataFront {
    annualConsumption: number,
    carbonOffsetFactorKgPerMWh: number,
    panels: {
        panelCapacityW: number,
        panelSize: {
            height: number,
            width: number
        },
        panelsCount:number,
        maxPanelsCount: number
    },
    tarifaCategory: string,
    yearlyEnergyDcKwh: number
}
