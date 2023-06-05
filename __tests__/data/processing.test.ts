import _ from "lodash";
import { mergeDataStores, validateJsonStringAsDatastore } from "../../src/data/processing";

describe('validateDataStore', () => {
    const mockMeal = {
        name: 'mockName',
        time: 'mockTime',
        servings: 1,
        kcalPerServing: 100
    };
    const mockPreset = {
        id: '1234567890',
        name: 'mockPresetMeal',
        kcalPerServing: 100
    };

    it('should validate the data store if shape is correct', () => {
        expect(() => validateJsonStringAsDatastore(JSON.stringify({
            database: {
                '2020-01': {
                    '01': [mockMeal]
                }
            },
            presets: [ mockPreset ]
        }))).not.toThrow();
    });

    it('should throw if database is missing', () => {
        expect(() => validateJsonStringAsDatastore(JSON.stringify({
            presets: [ mockPreset ]
        }))).toThrow();
    });
    it('should throw if database key is not the right format', () => {
        expect(() => validateJsonStringAsDatastore(JSON.stringify({
            database: {
                'not yyyy-mm': {
                    '01': [mockMeal]
                }
            },
            presets: [ mockPreset ]
        }))).toThrow();
    });
    it('should throw if database day key is not the right format', () => {
        expect(() => validateJsonStringAsDatastore(JSON.stringify({
            database: {
                '2020-01': {
                    'notDayKey': [mockMeal]
                }
            },
            presets: [ mockPreset ]
        }))).toThrow();
    });
    it('should throw if database entry is missing name', () => {
        expect(() => validateJsonStringAsDatastore(JSON.stringify({
            database: {
                '2020-01': {
                    '01': [_.omit(mockMeal, 'name')]
                }
            },
            presets: [ mockPreset ]
        }))).toThrow();
    });
    it('should throw if database entry is missing time', () => {
        expect(() => validateJsonStringAsDatastore(JSON.stringify({
            database: {
                '2020-01': {
                    '01': [_.omit(mockMeal, 'time')]
                }
            },
            presets: [ mockPreset ]
        }))).toThrow();
    });
    it('should throw if database entry is missing servings', () => {
        expect(() => validateJsonStringAsDatastore(JSON.stringify({
            database: {
                '2020-01': {
                    '01': [_.omit(mockMeal, 'servings')]
                }
            },
            presets: [ mockPreset ]
        }))).toThrow();
    });
    it('should throw if database entry is missing kcalPerServing', () => {
        expect(() => validateJsonStringAsDatastore(JSON.stringify({
            database: {
                '2020-01': {
                    '01': [_.omit(mockMeal, 'kcalPerServing')]
                }
            },
            presets: [ mockPreset ]
        }))).toThrow();
    });
    it('should throw if preset is not an array', () => {
        expect(() => validateJsonStringAsDatastore(JSON.stringify({
            database: {
                '2020-01': {
                    '01': [mockMeal]
                }
            },
            presets: { preset: mockPreset }
        }))).toThrow();
    });
    it('should throw if preset is missing name', () => {
        expect(() => validateJsonStringAsDatastore(JSON.stringify({
            database: {
                '2020-01': {
                    '01': [mockMeal]
                }
            },
            presets: [ _.omit(mockPreset, 'name') ]
        }))).toThrow();
    });
    it('should throw if preset is missing id', () => {
        expect(() => validateJsonStringAsDatastore(JSON.stringify({
            database: {
                '2020-01': {
                    '01': [mockMeal]
                }
            },
            presets: [ _.omit(mockPreset, 'id') ]
        }))).toThrow();
    });
    it('should throw if preset is missing kcalPerServing', () => {
        expect(() => validateJsonStringAsDatastore(JSON.stringify({
            database: {
                '2020-01': {
                    '01': [mockMeal]
                }
            },
            presets: [ _.omit(mockPreset, 'kcalPerServing') ]
        }))).toThrow();
    });
});

describe('mergeDataStore', () => {
    const mockMeal1 = {
        name: 'mockName1',
        time: '01:01',
        servings: 1,
        kcalPerServing: 100
    };
    const mockMeal2 = {
        name: 'mockName2',
        time: '02:02',
        servings: 1,
        kcalPerServing: 100
    };
    const mockMeal3 = {
        name: 'mockName3',
        time: '03:03',
        servings: 1,
        kcalPerServing: 100
    };
    const mockMeal4 = {
        name: 'mockName4',
        time: '04:04',
        servings: 1,
        kcalPerServing: 100
    };

    const mockPreset1 = {
        id: 'id1',
        name: 'mockPresetMeal',
        kcalPerServing: 100
    };
    const mockPreset2 = {
        id: 'id2',
        name: 'mockPresetMeal',
        kcalPerServing: 100
    };

    it('should merge data properly', () => {
        expect(mergeDataStores({
            preferredDataStore: {
                database: {
                    'onlyInPreferred': {
                        '01': [mockMeal1]
                    },
                    'inBoth': {
                        'onlyPreferred': [mockMeal2],
                        'inBoth': [mockMeal3],
                    }
                },
                presets: [mockPreset1]
            },
            mergingDataStore: {
                database: {
                    'onlyInMerging': {
                        '01': [mockMeal4]
                    },
                    'inBoth': {
                        'onlyMerging': [mockMeal4],
                        'inBoth': [
                            {...mockMeal3, servings: 'something that will be overridden' as any}, 
                            mockMeal2
                        ],
                    }
                },
                presets: [mockPreset2]
            },
        })).toEqual({
            database: {
                'onlyInPreferred': {
                    '01': [mockMeal1]
                },
                'onlyInMerging': {
                    '01': [mockMeal4]
                },
                'inBoth': {
                    'onlyPreferred': [mockMeal2],
                    // from both, and merging entry gets overridden since same name/time
                    // gets resorted since 2 has earlier time than 3
                    'inBoth': [mockMeal2, mockMeal3],
                    'onlyMerging': [mockMeal4],
                }
            },
            presets: [mockPreset1, mockPreset2]
        })
    });
});
