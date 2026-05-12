import { Card, Badge } from "@/components/ui";
import Icon, { type IconName } from "@/components/ui/Icon";

interface Props {
  title: string;
  description: string;
  frId?: string;
  icon?: IconName;
}

export default function Placeholder({
  title,
  description,
  frId,
  icon = "doc",
}: Props) {
  return (
    <div className="space-y-5">
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2.5">
            <h1 className="m-0 text-[22px] font-semibold tracking-tight text-ink">
              {title}
            </h1>
            <Badge tone="warn">Đang phát triển</Badge>
          </div>
          <p className="mt-1 text-[13.5px] text-ink-muted">{description}</p>
        </div>
      </div>

      <Card>
        <div className="py-12 flex flex-col items-center justify-center text-center gap-3">
          <div className="w-14 h-14 rounded-xl bg-navy-50 text-navy-600 grid place-items-center">
            <Icon name={icon} size={28} />
          </div>
          <div>
            <div className="text-[15px] font-semibold text-ink">
              Màn hình này đang được xây dựng
            </div>
            <p className="mt-1 text-[13px] text-ink-muted max-w-md">
              Backend API và UI chi tiết sẽ được implement sau khi xong các data
              model cốt lõi (Major / Course / Semester / ClassSection).
            </p>
            {frId && (
              <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface text-[11.5px] font-mono text-ink-muted">
                <Icon name="doc" size={12} />
                Tham chiếu SRS: {frId}
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
