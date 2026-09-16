import { SiteCopy } from '../site-editor/SiteCopy'
import { useSiteEditor } from '../site-editor/useSiteEditor'
import { useMemo, useState } from 'react'

import type { PublicMemberRow } from '../../types/cms'
import {
  filterPublicMembersForArchive,
  getMemberGroupLabel,
  getMemberPartLabel,
  getMemberStatus,
  getPublicMemberName,
  groupPublicMembersForArchive,
  type MemberArchivePartFilter,
  type MemberArchiveStatusFilter,
} from '../../utils/memberName'
import '../../styles/members-archive.css'

interface MembersArchiveExperienceProps {
  headingLevel?: 'h1' | 'h2'
  members: PublicMemberRow[]
}

interface FilterOption<TValue extends string> {
  label: string
  value: TValue
}

const statusFilters: Array<FilterOption<MemberArchiveStatusFilter>> = [
  { label: '전체 단원', value: 'all' },
  { label: '현재 활동', value: 'active' },
  { label: '이전 활동', value: 'alumni' },
]

const partFilters: Array<FilterOption<MemberArchivePartFilter>> = [
  { label: '전체 파트', value: 'all' },
  { label: '소프라노', value: 'soprano' },
  { label: '알토', value: 'alto' },
  { label: '테너', value: 'tenor' },
  { label: '베이스', value: 'bass' },
  { label: '스태프', value: 'staff' },
]

export function MembersArchiveExperience({
  headingLevel = 'h1',
  members,
}: MembersArchiveExperienceProps) {
  const { copy: copyText } = useSiteEditor()
  const { copy: editorCopy } = useSiteEditor()
  const [statusFilter, setStatusFilter] =
    useState<MemberArchiveStatusFilter>('all')
  const [partFilter, setPartFilter] =
    useState<MemberArchivePartFilter>('all')
  const filteredMembers = useMemo(
    () =>
      filterPublicMembersForArchive(members, statusFilter, partFilter),
    [members, partFilter, statusFilter],
  )
  const visibleGroups = useMemo(
    () =>
      groupPublicMembersForArchive(filteredMembers).filter(
        (group) => group.members.length > 0,
      ),
    [filteredMembers],
  )
  const Heading = headingLevel
  const ArchiveHeading = headingLevel === 'h1' ? 'h2' : 'h3'

  return (
    <section
      aria-labelledby="members-archive-title"
      className="members-archive"
      data-member-archive
      id="members"
    >
      <div className="members-archive__intro">
        <div className="members-archive__intro-inner">
          <div className="members-archive__intro-copy">
            <p className="members-archive__eyebrow"><SiteCopy page="members" id="members.membersArchiveExperience.english1" fallback={"MEMBER ARCHIVE / SEOUL"} /></p>
            <Heading className="members-archive__title" id="members-archive-title">
              <span><SiteCopy page="members" id="members.membersArchiveExperience.text1" fallback={"함께한 모든 이름이"} /></span>
              <span><SiteCopy page="members" id="members.membersArchiveExperience.text2" fallback={"지금의 합창단을 만듭니다."} /></span>
            </Heading>
            <span aria-hidden="true" className="members-archive__title-rule" />
            <p className="members-archive__description"><SiteCopy page="members" id="members.membersArchiveExperience.text3" fallback={"2014년 창단 이후 서울모테트청소년합창단과 함께한 단원을 한 자리에서 소개합니다."} /><br /><SiteCopy page="members" id="members.membersArchiveExperience.text4" fallback={"현재 활동 중인 단원도 이 아카이브에 함께 기록됩니다."} /></p>
            <p className="members-archive__privacy-note"><SiteCopy page="members" id="members.membersArchiveExperience.text5" fallback={"이름은 공개 설정에 따라 전체·부분·비공개 방식으로 표시됩니다."} /></p>
          </div>

          <div
            aria-label={editorCopy("members", "members.membersArchiveExperience.english2", "All voices. One archive.")}
            className="members-archive__statement"
          >
            <p>
              <span><SiteCopy page="members" id="members.membersArchiveExperience.english3" fallback={"All voices."} /></span>
              <span><SiteCopy page="members" id="members.membersArchiveExperience.english4" fallback={"One archive."} /></span>
            </p>
            <small>
              <span className="members-archive__statement-prefix"><SiteCopy page="members" id="members.membersArchiveExperience.english5" fallback={"ALL MEMBERS ·"} />{' '}
              </span><SiteCopy page="members" id="members.membersArchiveExperience.english6" fallback={"ACTIVE & FORMER · BY PART"} /></small>
          </div>
        </div>
      </div>

      <div className="members-archive__directory">
        <div className="members-archive__directory-inner">
          <div className="members-archive__directory-header">
            <div className="members-archive__directory-copy">
              <p className="members-archive__directory-eyebrow"><SiteCopy page="members" id="members.membersArchiveExperience.english7" fallback={"ALL MEMBERS / ONE ARCHIVE"} /></p>
              <ArchiveHeading className="members-archive__directory-title"><SiteCopy page="members" id="members.membersArchiveExperience.text6" fallback={"단원 아카이브"} /></ArchiveHeading>
              <p><SiteCopy page="members" id="members.membersArchiveExperience.text7" fallback={"현재 활동 중인 단원과 이전 활동 단원을 한 명단 안에서 살펴봅니다."} /></p>
              <p className="members-archive__current-key">
                <span aria-hidden="true" /><SiteCopy page="members" id="members.membersArchiveExperience.text8" fallback={"현재 활동 단원 포함"} /></p>
            </div>

            <div className="members-archive__filters">
              <div
                aria-label={editorCopy("members", "members.membersArchiveExperience.ariaLabel9", "활동 상태 필터")}
                className="members-archive__status-filters"
                role="group"
              >
                {statusFilters.map((filter) => (
                  <button
                    aria-pressed={statusFilter === filter.value}
                    className="members-archive__filter-button members-archive__filter-button--status"
                    key={filter.value}
                    onClick={() => setStatusFilter(filter.value)}
                    type="button"
                  >
                    {editorCopy('members', `members.status.${filter.value}`, filter.label)}
                  </button>
                ))}
              </div>

              <div
                aria-label={editorCopy("members", "members.membersArchiveExperience.ariaLabel10", "파트 필터")}
                className="members-archive__part-filters"
                role="group"
              >
                {partFilters.map((filter) => (
                  <button
                    aria-pressed={partFilter === filter.value}
                    className="members-archive__filter-button members-archive__filter-button--part"
                    key={filter.value}
                    onClick={() => setPartFilter(filter.value)}
                    type="button"
                  >
                    {editorCopy('members', `members.part.${filter.value}`, filter.label)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <p aria-live="polite" className="members-archive__sr-only"><SiteCopy page="members" id="members.membersArchiveExperience.text11" fallback={"조건에 맞는 공개 단원 "} />{filteredMembers.length}{copyText("members", "members.fixed.MembersArchiveExperience.9f96b8e22c", "명")}</p>

          {visibleGroups.length > 0 ? (
            <div className="members-archive__groups">
              {visibleGroups.map((group) => (
                <section
                  aria-labelledby={`member-group-${group.key}`}
                  className="members-archive__group"
                  key={group.key}
                >
                  <h3
                    className="members-archive__group-title"
                    id={`member-group-${group.key}`}
                  >
                    {editorCopy('members', `members.groupHeading.${group.key}`, group.label)}
                  </h3>
                  <ul className="members-archive__member-list">
                    {group.members.map((member) => {
                      const isActive = getMemberStatus(member) === 'active'
                      const isStaff = member.group_type === 'staff'
                      const groupLabel = isStaff
                        ? editorCopy('members', 'members.group.staffDisplay', 'STAFF')
                        : editorCopy('members', `members.group.${member.group_type}`, getMemberGroupLabel(member.group_type))
                      const partLabel = isStaff
                        ? null
                        : editorCopy('members', `members.part.${member.part}`, getMemberPartLabel(member.part).toUpperCase())

                      return (
                        <li
                          className="members-archive__member"
                          key={member.id}
                        >
                          <div className="members-archive__member-copy">
                            <strong>{getPublicMemberName(member)}</strong>
                            <span>
                              {groupLabel}
                              {partLabel ? ` · ${partLabel}` : ''}
                            </span>
                          </div>
                          <span
                            className={
                              isActive
                                ? 'members-archive__status is-active'
                                : 'members-archive__status'
                            }
                          >
                            {isActive ? <i aria-hidden="true" /> : null}
                            {isActive ? editorCopy('members', 'members.badge.active', '현재 활동') : editorCopy('members', 'members.badge.alumni', '함께한 단원')}
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                </section>
              ))}
            </div>
          ) : (
            <div className="members-archive__empty" role="status">
              <strong><SiteCopy page="members" id="members.membersArchiveExperience.text12" fallback={"조건에 맞는 공개 단원이 없습니다."} /></strong>
              <p><SiteCopy page="members" id="members.membersArchiveExperience.text13" fallback={"활동 상태나 파트 필터를 바꾸어 다시 살펴보세요."} /></p>
            </div>
          )}

          <div className="members-archive__directory-footer">
            <p><SiteCopy page="members" id="members.membersArchiveExperience.text14" fallback={"모든 활동 시기와 파트가 한 아카이브 안에서 이어집니다."} /></p>
            <p><SiteCopy page="members" id="members.membersArchiveExperience.text15" fallback={"가나다순 · PART INDEX"} /></p>
          </div>
        </div>
      </div>
    </section>
  )
}
