export interface SolarDataFront {
    annualConsumption: number,
    carbonOffsetFactorKgPerMWh: number,
    panels: {
        maxPanelsPerSuperface: number,
        panelCapacityW: number,
        panelSize: {
            height: number,
            width: number
        },
        panelsCountApi:number,
        
    },
    tarifaCategory: string,
    yearlyEnergyAcKwh: number
}
