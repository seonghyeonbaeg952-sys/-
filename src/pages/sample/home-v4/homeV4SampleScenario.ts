import { homeV4SampleFixtures } from './homeV4SampleFixtures'
import type {
  HomeV4SampleFixture,
  HomeV4ScenarioMode,
} from './homeV4SampleTypes'

export function getHomeV4SampleFixture(
  scenario: HomeV4ScenarioMode,
): HomeV4SampleFixture {
  if (scenario === 'long-copy') {
    return homeV4SampleFixtures.longCopy
  }

  if (scenario === 'empty-data') {
    return homeV4SampleFixtures.emptyData
  }

  return homeV4SampleFixtures.normal
}
