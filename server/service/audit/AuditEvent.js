import { v4 as generateId } from 'node-uuid'
import { getIn, symbolToString } from '../../../common/util'
import * as EVENTS from './AuditEventTypes'

export default class AuditEvent {
  constructor(auditEventType) {
    this.timestamp = new Date()
    this.id = generateId()
    this.type = auditEventType
  }

  byUser(login) {
    this.user = login
    return this
  }

  fromGithubEvent(githubEvent) {
    this._rawGithubEvent = githubEvent
    this.githubEvent = {
      sender: getIn(githubEvent, ['sender', 'login'], 'UNKNOWN SENDER'),
      action: getIn(githubEvent, 'action')
    }
    return this
  }

  onResource(resource) {
    const id = getIn(resource, ['repository', 'id'])
    const full_name = getIn(resource, ['repository', 'full_name'])
    const url = getIn(resource, ['repository', 'url'])
    const clone_url = getIn(resource, ['repository', 'clone_url'])
    const git_url = getIn(resource, ['repository', 'git_url'])
    const ssh_url = getIn(resource, ['repository', 'ssh_url'])
    const issue = getIn(resource, 'issue_number')
    const commit = getIn(resource, 'commit')
    const pull_request = getIn(resource, 'pull_request')

    this._rawResource = resource
    this.resource = {
      repository: {id, full_name, url, clone_url, git_url, ssh_url},
      issue,
      commit,
      pull_request
    }
    return this
  }

  withResult(result) {
    this._rawResult = result
    // currently there is no processing depending on event type
    this.result = result
    return this
  }

}
