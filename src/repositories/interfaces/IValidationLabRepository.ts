import { CalibrationProposal, ValidationAggregate, ValidationLabExport, ValidationScenario } from '../../models';
import { RepositoryActor } from '../../models/Stage6Models';
export interface ValidationScenarioInput extends Omit<ValidationScenario,'scenarioId'|'ownerUserId'|'expertPseudonym'|'createdAt'|'anonymized'|'schemaVersion'|'environment'|'currency'|'calculationStatus'|'engineEstimatedPrice'|'engineVersion'|'settingsVersion'|'tariffVersion'>{}
export interface IValidationLabRepository {
 isEnabled(actor:RepositoryActor):Promise<boolean>;
 setEnabled(actor:RepositoryActor,enabled:boolean):Promise<boolean>;
 createScenario(actor:RepositoryActor,input:ValidationScenarioInput):Promise<ValidationScenario>;
 getScenarios(actor:RepositoryActor):Promise<ValidationScenario[]>;
 getScenario(actor:RepositoryActor,id:string):Promise<ValidationScenario|null>;
 getAggregate(actor:RepositoryActor,filter:Partial<Pick<ValidationScenario,'serviceId'|'unit'|'province'|'regionClass'|'complexityLevel'|'urgencyLevel'|'expertConfidence'>>):Promise<ValidationAggregate>;
 createCalibrationSuggestion(actor:RepositoryActor,groupKey:string,filter:Partial<ValidationScenario>):Promise<CalibrationProposal|null>;
 versionProposal(actor:RepositoryActor,proposalId:string):Promise<CalibrationProposal>;
 exportDemo(actor:RepositoryActor):Promise<ValidationLabExport>;
 importDemo(actor:RepositoryActor,source:string):Promise<number>;
}
