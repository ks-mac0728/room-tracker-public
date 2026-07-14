import plistlib, uuid

JS_CODE = open('ios_shortcut_js.js').read()
WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbyzLvVzPzT16OzGwAwYbFstGJyUqeTve1R3r-wIqbyvfdWZpPX9BeOXqdjDAS8muIoocg/exec'
js_uuid = str(uuid.uuid4()).upper()
OBJ = '￼'

shortcut = {
    'WFWorkflowClientVersion': '1240.0.1',
    'WFWorkflowHasOutputFallback': False,
    'WFWorkflowHasShortcutInputVariables': False,
    'WFWorkflowIcon': {
        'WFWorkflowIconGlyphNumber': 61440,
        'WFWorkflowIconStartColor': 463140863,
    },
    'WFWorkflowImportQuestions': [],
    'WFWorkflowInputContentItemClasses': [],
    'WFWorkflowMinimumClientVersion': 900,
    'WFWorkflowMinimumClientVersionString': '900',
    'WFWorkflowName': '楽天ROOMトラッカー',
    'WFWorkflowTypes': [],
    'WFWorkflowActions': [
        {
            'WFWorkflowActionIdentifier': 'is.workflow.actions.runjavascriptonwebpage',
            'WFWorkflowActionParameters': {
                'UUID': js_uuid,
                'CustomOutputName': 'JS結果',
                'WFJavaScript': JS_CODE,
            },
        },
        {
            'WFWorkflowActionIdentifier': 'is.workflow.actions.downloadurl',
            'WFWorkflowActionParameters': {
                'ShowHeaders': False,
                'WFURL': WEBAPP_URL,
                'WFHTTPMethod': 'POST',
                'WFHTTPBodyType': 'Text',
                'WFRequestVariable': {
                    'Value': {
                        'attachmentsByRange': {
                            '{0, 1}': {
                                'OutputName': 'JS結果',
                                'OutputUUID': js_uuid,
                                'Type': 'ActionOutput',
                            }
                        },
                        'string': OBJ,
                    },
                    'WFSerializationType': 'WFTextTokenString',
                },
                'WFHTTPHeaders': {
                    'Value': {
                        'WFDictionaryFieldValueItems': [
                            {
                                'WFItemType': 0,
                                'WFKey': {
                                    'Value': {'string': 'Content-Type'},
                                    'WFSerializationType': 'WFTextTokenString',
                                },
                                'WFValue': {
                                    'Value': {'string': 'application/json'},
                                    'WFSerializationType': 'WFTextTokenString',
                                },
                            }
                        ]
                    },
                    'WFSerializationType': 'WFDictionaryFieldValue',
                },
            },
        },
    ],
}

with open('shortcut_template.shortcut', 'wb') as f:
    plistlib.dump(shortcut, f, fmt=plistlib.FMT_XML)
print('done')
