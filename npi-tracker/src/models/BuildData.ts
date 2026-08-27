export interface OrderDetails {
    buildId: string;
    crdNumber: string,
    crdRevision: string;
    buildStage: string;
    rackQty: string;
}

export interface RackInfo {
    rackSerial: string;
}

export interface BuildData {
    orderDetails: OrderDetails;
    racks: RackInfo[];
}

export const DEFAULT_BUILD_DATA:
BuildData = {
    orderDetails: {
        buildId: "",
        crdNumber: "",
        crdRevision: "",
        buildStage: "",
        rackQty: ""
    },
    racks: []
};